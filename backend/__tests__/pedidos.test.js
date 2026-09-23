import { jest } from '@jest/globals'
import request from 'supertest'
import jwt from 'jsonwebtoken'

const mockQuery = jest.fn()
const mockConnect = jest.fn()
jest.unstable_mockModule('../src/db.js', () => ({
  default: { query: mockQuery, connect: mockConnect, on: jest.fn() },
}))

const { default: app } = await import('../src/server.js')
const { limiterPagamento } = await import('../src/middleware/rateLimiter.js')

const USUARIO = { id: 1, nome: 'Teste', email: 'teste@test.com', admin: false }

function token() {
  return jwt.sign({ id: USUARIO.id, email: USUARIO.email }, process.env.JWT_SECRET, { expiresIn: '5m' })
}

const CORPO = {
  cliente: { nome: 'Teste', email: 'teste@test.com' },
  pagamento: { metodo: 'pix' },
  itens: [{ produtoId: 1, quantidade: 2 }],
}

beforeEach(() => {
  mockQuery.mockReset()
  mockConnect.mockReset()
  for (const ip of ['127.0.0.1', '::1', '::ffff:127.0.0.1']) {
    limiterPagamento.resetKey(ip)
  }
})

describe('POST /api/pedidos', () => {
  it('deve recusar a compra de quem não está logado', async () => {
    const res = await request(app).post('/api/pedidos').send(CORPO)
    expect(res.status).toBe(401)
    expect(res.body.erro).toContain('autenticado')
    expect(res.body.token).toBeUndefined()
    expect(mockQuery).not.toHaveBeenCalled()
  })

  it('deve recusar token inválido', async () => {
    const res = await request(app)
      .post('/api/pedidos')
      .set('Authorization', 'Bearer token-errado')
      .send(CORPO)
    expect(res.status).toBe(401)
    expect(mockQuery).not.toHaveBeenCalled()
  })

  it('deve passar da autenticação com token válido', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [USUARIO] })
    const res = await request(app)
      .post('/api/pedidos')
      .set('Authorization', `Bearer ${token()}`)
      .send({})
    // Saiu do 401 e caiu na validação do corpo da requisição.
    expect(res.status).toBe(400)
    expect(res.body.erro).toContain('nome')
    expect(mockQuery).toHaveBeenCalledTimes(1)
  })

  it('deve criar o pedido vinculado ao usuário logado', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [USUARIO] }) // middleware de auth

    const client = { release: jest.fn(), query: jest.fn() }
    const fila = [
      { rows: [] }, // BEGIN
      { rows: [{ id: 1, nome: 'Produto', preco: 20, estoque: 10 }] }, // SELECT produtos
      { rows: [] }, // SELECT clientes
      { rows: [{ id: 7 }] }, // INSERT clientes
      { rows: [{ id: 3, total: 40, status: 'pago' }] }, // INSERT pedidos
      { rows: [] }, // baixa de estoque
      { rows: [] }, // COMMIT
    ]
    client.query.mockImplementation(() => Promise.resolve(fila.shift() || { rows: [] }))
    mockConnect.mockResolvedValue(client)

    const res = await request(app)
      .post('/api/pedidos')
      .set('Authorization', `Bearer ${token()}`)
      .send(CORPO)

    expect(res.status).toBe(201)
    expect(res.body.id).toBe(3)
    // Pedido de conta logada não depende mais de checkoutToken de convidado.
    expect(res.body.checkoutToken).toBeUndefined()

    const insert = client.query.mock.calls.find(([sql]) => String(sql).includes('INSERT INTO pedidos'))
    expect(insert).toBeDefined()
    expect(insert[1][0]).toBe(USUARIO.id) // usuario_id
    expect(client.release).toHaveBeenCalled()
  })
})

describe('POST /api/pagamentos/preferencia', () => {
  it('deve exigir login para gerar a cobrança', async () => {
    const res = await request(app).post('/api/pagamentos/preferencia').send({ pedidoId: 1 })
    expect(res.status).toBe(401)
    expect(res.body.erro).toContain('autenticado')
  })
})
