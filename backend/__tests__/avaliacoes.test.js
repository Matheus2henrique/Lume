import { jest } from '@jest/globals'
import request from 'supertest'
import jwt from 'jsonwebtoken'

const mockQuery = jest.fn()
const mockConnect = jest.fn()
jest.unstable_mockModule('../src/db.js', () => ({
  default: { query: mockQuery, connect: mockConnect, on: jest.fn() },
}))

const { default: app } = await import('../src/server.js')
const { limiterAvaliacao } = await import('../src/middleware/rateLimiter.js')

const USUARIO = { id: 7, nome: 'Maria', email: 'maria@exemplo.com', admin: false }

function token() {
  return jwt.sign({ id: USUARIO.id, email: USUARIO.email, tv: 0 }, process.env.JWT_SECRET, {
    expiresIn: '5m',
  })
}

/** Responde cada chamada pelo trecho do SQL — sessão + os 3 caminhos da rota. */
function mockarSql(pares) {
  const sessao = ['SELECT * FROM usuarios', [{ ...USUARIO, token_version: 0, admin: false }]]
  const todos = [sessao, ...pares]
  mockQuery.mockImplementation(async (sql) => {
    for (const [trecho, rows] of todos) {
      if (sql.includes(trecho)) return { rows, rowCount: rows.length }
    }
    return { rows: [], rowCount: 0 }
  })
}

/** Só a sessão do usuário (para testes que falham na validação antes do SQL). */
function mockarSessao() {
  mockarSql([])
}

function semInsert() {
  expect(mockQuery.mock.calls.some(([sql]) => sql.includes('INSERT INTO avaliacoes'))).toBe(false)
}

const produtoExiste = ['SELECT id FROM produtos', [{ id: 1 }]]

const AVALIACOES = [
  {
    id: 2,
    nota: 5,
    texto: 'Ficou perfeita, superou a expectativa!',
    criado_em: '2026-02-01T12:00:00Z',
    atualizado_em: '2026-02-01T12:00:00Z',
    nome: 'Maria',
  },
  {
    id: 1,
    nota: 4,
    texto: 'Muito bom, só queria um pouco maior.',
    criado_em: '2026-01-10T12:00:00Z',
    atualizado_em: '2026-01-10T12:00:00Z',
    nome: 'João',
  },
]

beforeEach(() => {
  mockQuery.mockReset()
  mockConnect.mockReset()
  for (const ip of ['127.0.0.1', '::1', '::ffff:127.0.0.1']) {
    limiterAvaliacao.resetKey(ip)
  }
})

describe('GET /api/avaliacoes/:produtoId', () => {
  it('é público: lista sem token, com média e total', async () => {
    mockarSql([produtoExiste, ['FROM avaliacoes', AVALIACOES]])

    const res = await request(app).get('/api/avaliacoes/1')

    expect(res.status).toBe(200)
    expect(res.body.total).toBe(2)
    expect(res.body.media).toBe(4.5)
    expect(res.body.avaliacoes.map((a) => a.nome)).toEqual(['Maria', 'João'])
    expect(res.body.avaliacoes[0].texto).toContain('perfeita')
  })

  it('devolve média 0 e lista vazia quando ninguém avaliou', async () => {
    mockarSql([produtoExiste, ['FROM avaliacoes', []]])

    const res = await request(app).get('/api/avaliacoes/1')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ media: 0, total: 0, avaliacoes: [] })
  })

  it('rejeita id que não é número', async () => {
    const res = await request(app).get('/api/avaliacoes/abc')
    expect(res.status).toBe(400)
    expect(mockQuery).not.toHaveBeenCalled()
  })

  it('devolve 404 para produto inexistente', async () => {
    mockarSql([['SELECT id FROM produtos', []]])

    const res = await request(app).get('/api/avaliacoes/999')

    expect(res.status).toBe(404)
    expect(res.body.erro).toContain('não encontrado')
  })
})

describe('POST /api/avaliacoes/:produtoId', () => {
  it('exige sessão', async () => {
    const res = await request(app).post('/api/avaliacoes/1').send({ nota: 5, texto: 'Ótimo' })
    expect(res.status).toBe(401)
    expect(mockQuery).not.toHaveBeenCalled()
  })

  it('rejeita nota fora de 1..5', async () => {
    mockarSessao()

    const res = await request(app)
      .post('/api/avaliacoes/1')
      .set('Authorization', `Bearer ${token()}`)
      .send({ nota: 6, texto: 'Boa peça' })

    expect(res.status).toBe(400)
    expect(res.body.erro).toContain('1 a 5 estrelas')
    semInsert()
  })

  it('rejeita comentário com menos de 3 caracteres', async () => {
    mockarSessao()

    const res = await request(app)
      .post('/api/avaliacoes/1')
      .set('Authorization', `Bearer ${token()}`)
      .send({ nota: 4, texto: 'ok' })

    expect(res.status).toBe(400)
    expect(res.body.erro).toContain('3 caracteres')
    semInsert()
  })

  it('rejeita comentário acima de 1000 caracteres', async () => {
    mockarSessao()

    const res = await request(app)
      .post('/api/avaliacoes/1')
      .set('Authorization', `Bearer ${token()}`)
      .send({ nota: 4, texto: 'x'.repeat(1001) })

    expect(res.status).toBe(400)
    expect(res.body.erro).toContain('1000')
    semInsert()
  })

  it('cria a primeira avaliação (201) com upsert e sem duplicar', async () => {
    mockarSql([
      produtoExiste,
      [
        'INSERT INTO avaliacoes',
        [
          {
            id: 10,
            nota: 4,
            texto: 'Muito bom!',
            criado_em: '2026-03-01T10:00:00Z',
            atualizado_em: '2026-03-01T10:00:00Z',
            criado: true,
          },
        ],
      ],
    ])

    const res = await request(app)
      .post('/api/avaliacoes/1')
      .set('Authorization', `Bearer ${token()}`)
      .send({ nota: 4, texto: '  Muito bom!  ' })

    expect(res.status).toBe(201)
    expect(res.body.nome).toBe('Maria')
    expect(res.body.texto).toBe('Muito bom!') // trim aplicado

    const [sql, params] = mockQuery.mock.calls.find(([s]) => s.includes('INSERT INTO avaliacoes'))
    expect(sql).toContain('ON CONFLICT (produto_id, usuario_id)')
    expect(sql).toContain('DO UPDATE SET nota = EXCLUDED.nota')
    expect(params).toEqual([1, USUARIO.id, 4, 'Muito bom!'])
  })

  it('atualiza a avaliação existente (200) em vez de criar outra', async () => {
    mockarSql([
      produtoExiste,
      [
        'INSERT INTO avaliacoes',
        [
          {
            id: 10,
            nota: 5,
            texto: 'Mudei de ideia, ficou ótima',
            criado_em: '2026-03-01T10:00:00Z',
            atualizado_em: '2026-03-02T10:00:00Z',
            criado: false,
          },
        ],
      ],
    ])

    const res = await request(app)
      .post('/api/avaliacoes/1')
      .set('Authorization', `Bearer ${token()}`)
      .send({ nota: 5, texto: 'Mudei de ideia, ficou ótima' })

    expect(res.status).toBe(200)
    expect(res.body.criado).toBe(false)
  })

  it('devolve 404 quando o produto não existe', async () => {
    mockarSql([['SELECT id FROM produtos', []]])

    const res = await request(app)
      .post('/api/avaliacoes/42')
      .set('Authorization', `Bearer ${token()}`)
      .send({ nota: 5, texto: 'Boa peça' })

    expect(res.status).toBe(404)
    expect(res.body.erro).toContain('não encontrado')
  })

  it('bloqueia flood de avaliações com 429 após 10 envios no minuto', async () => {
    mockarSql([
      produtoExiste,
      [
        'INSERT INTO avaliacoes',
        [
          {
            id: 11,
            nota: 5,
            texto: 'Boa peça',
            criado_em: '2026-03-01T10:00:00Z',
            atualizado_em: '2026-03-01T10:00:00Z',
            criado: true,
          },
        ],
      ],
    ])

    for (let i = 0; i < 10; i += 1) {
      const ok = await request(app)
        .post('/api/avaliacoes/1')
        .set('Authorization', `Bearer ${token()}`)
        .send({ nota: 5, texto: `Boa peça ${i}` })
      expect(ok.status).toBe(201)
    }

    const bloqueada = await request(app)
      .post('/api/avaliacoes/1')
      .set('Authorization', `Bearer ${token()}`)
      .send({ nota: 5, texto: 'De novo' })

    expect(bloqueada.status).toBe(429)
    expect(bloqueada.body.erro).toContain('Muitas avaliações')
  })
})
