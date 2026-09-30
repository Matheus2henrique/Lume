import { jest } from '@jest/globals'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import pino from 'pino'

const mockQuery = jest.fn()
const mockClientQuery = jest.fn()
const mockRelease = jest.fn()
jest.unstable_mockModule('../src/db.js', () => ({
  default: {
    query: mockQuery,
    connect: jest.fn(async () => ({ query: mockClientQuery, release: mockRelease })),
    on: jest.fn(),
  },
}))

const { default: app } = await import('../src/server.js')
const { mascaraEmail, opcoesLogger } = await import('../src/logger.js')

const USUARIO = { id: 1, nome: 'Teste', email: 'teste@test.com', admin: false }

function token() {
  return jwt.sign({ id: 1, email: USUARIO.email, tv: 0 }, process.env.JWT_SECRET, {
    expiresIn: '5m',
  })
}

beforeEach(() => {
  mockQuery.mockReset()
  mockClientQuery.mockReset()
  mockRelease.mockReset()
  mockClientQuery.mockResolvedValue({ rows: [], rowCount: 0 })
})

describe('logger — LGPD', () => {
  it('mascara o e-mail para o log', () => {
    expect(mascaraEmail('maria@exemplo.com')).toBe('m***@e***')
    expect(mascaraEmail('  Maria@Exemplo.COM ')).toBe('m***@e***')
    expect(mascaraEmail('sem-arroba')).toBe('[e-mail]')
    expect(mascaraEmail('')).toBe('[e-mail]')
  })

  it('nunca escreve e-mail, senha, código ou token no log', () => {
    let saida = ''
    const stream = { write: (chunk) => (saida += chunk) }
    const opcoes = opcoesLogger()
    delete opcoes.transport // instância em memória, sem transporte de terminal
    const logger = pino(opcoes, stream)

    logger.info({ email: 'maria@exemplo.com', senha: 'segredo123', codigo: '4321' }, 'login')
    logger.info({ req: { headers: { authorization: 'Bearer token-secreto' } } }, 'requisição')

    expect(saida).not.toContain('maria@exemplo.com')
    expect(saida).not.toContain('segredo123')
    expect(saida).not.toContain('4321')
    expect(saida).not.toContain('token-secreto')
    expect(saida).toContain('[REDACTED]')
  })
})

describe('POST /api/newsletter — consentimento', () => {
  it('recusa inscrição sem aceite explícito', async () => {
    const res = await request(app).post('/api/newsletter').send({ email: 'x@y.com' })
    expect(res.status).toBe(400)
    expect(res.body.erro).toContain('aceitar')
    expect(mockQuery).not.toHaveBeenCalled()
  })

  it('grava o aceite com data/hora', async () => {
    const res = await request(app)
      .post('/api/newsletter')
      .send({ email: 'x@y.com', aceite: true })
    expect(res.status).toBe(201)
    const sql = String(mockQuery.mock.calls[0][0])
    expect(sql).toContain('aceite')
    expect(sql).toContain('aceite_em')
    expect(mockQuery.mock.calls[0][1]).toEqual(['x@y.com'])
  })

  it('recusa e-mail inválido', async () => {
    const res = await request(app)
      .post('/api/newsletter')
      .send({ email: 'errado', aceite: true })
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/auth/dados — exclusão da conta', () => {
  it('exige sessão', async () => {
    const res = await request(app).delete('/api/auth/dados').send({ confirmacao: 'x@y.com' })
    expect(res.status).toBe(401)
  })

  it('exige confirmar o e-mail da própria conta', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [USUARIO] })
    const res = await request(app)
      .delete('/api/auth/dados')
      .set('Authorization', `Bearer ${token()}`)
      .send({ confirmacao: 'outro@x.com' })
    expect(res.status).toBe(400)
    expect(mockClientQuery).not.toHaveBeenCalled()
  })

  it('não deixa a administradora apagar a própria conta', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ ...USUARIO, admin: true }] })
    const res = await request(app)
      .delete('/api/auth/dados')
      .set('Authorization', `Bearer ${token()}`)
      .send({ confirmacao: USUARIO.email })
    expect(res.status).toBe(403)
    expect(mockClientQuery).not.toHaveBeenCalled()
  })

  it('anonimiza pedidos, remove cadastro/newsletter e apaga a conta na mesma transação', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [USUARIO] })

    const res = await request(app)
      .delete('/api/auth/dados')
      .set('Authorization', `Bearer ${token()}`)
      .send({ confirmacao: 'TESTE@test.com' }) // caixa mista

    expect(res.status).toBe(200)
    expect(res.body.mensagem).toContain('excluídos')

    const sqls = mockClientQuery.mock.calls.map(([sql]) => String(sql))
    expect(sqls[0]).toBe('BEGIN')
    expect(sqls.at(-1)).toBe('COMMIT')
    expect(sqls).not.toContain('ROLLBACK')

    const anonimiza = sqls.find((sql) => sql.includes('cliente_dados'))
    expect(anonimiza).toContain('usuario_id = NULL')
    expect(anonimiza).toContain('Cliente removido')

    expect(sqls.find((sql) => sql.includes('DELETE FROM clientes'))).toContain(
      'NOT EXISTS'
    ) // só apaga se nenhum pedido ainda usar
    expect(sqls.find((sql) => sql.includes('DELETE FROM newsletter'))).toBeDefined()
    expect(sqls.find((sql) => sql.includes('DELETE FROM usuarios'))).toBeDefined()
    expect(mockRelease).toHaveBeenCalled()
  })

  it('derruba a transação e responde 500 se algo falhar', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [USUARIO] })
    mockClientQuery.mockImplementation(async (sql) => {
      if (String(sql) === 'BEGIN') return { rows: [] }
      if (String(sql).includes('DELETE FROM usuarios')) throw new Error('db off')
      return { rows: [], rowCount: 0 }
    })

    const res = await request(app)
      .delete('/api/auth/dados')
      .set('Authorization', `Bearer ${token()}`)
      .send({ confirmacao: USUARIO.email })

    expect(res.status).toBe(500)
    const sqls = mockClientQuery.mock.calls.map(([sql]) => String(sql))
    expect(sqls).toContain('ROLLBACK')
    expect(mockRelease).toHaveBeenCalled()
  })
})
