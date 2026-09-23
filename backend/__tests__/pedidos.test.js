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
const ADMIN = { id: 2, nome: 'Admin', email: 'admin@test.com', admin: true }

function token() {
  return jwt.sign({ id: USUARIO.id, email: USUARIO.email }, process.env.JWT_SECRET, { expiresIn: '5m' })
}

function tokenAdmin() {
  return jwt.sign({ id: ADMIN.id, email: ADMIN.email }, process.env.JWT_SECRET, { expiresIn: '5m' })
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

describe('POST /api/pedidos — personalização', () => {
  it('deve recusar personalização que não é data URL', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [USUARIO] })
    const res = await request(app)
      .post('/api/pedidos')
      .set('Authorization', `Bearer ${token()}`)
      .send({
        ...CORPO,
        itens: [
          {
            produtoId: 1,
            quantidade: 1,
            personalizacao: { nome: 'frase.pdf', tipo: 'application/pdf', dados: 'nao-e-base64' },
          },
        ],
      })
    expect(res.status).toBe(400)
    expect(res.body.erro).toContain('Personalização')
    expect(mockConnect).not.toHaveBeenCalled() // recusado antes da transação
  })

  it('deve gravar a personalização válida no pedido', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [USUARIO] })

    const client = { release: jest.fn(), query: jest.fn() }
    const fila = [
      { rows: [] }, // BEGIN
      { rows: [{ id: 1, nome: 'Produto', preco: 20, estoque: 10 }] }, // SELECT produtos
      { rows: [] }, // SELECT clientes
      { rows: [{ id: 7 }] }, // INSERT clientes
      { rows: [{ id: 4, total: 20, status: 'pago' }] }, // INSERT pedidos
      { rows: [] }, // baixa de estoque
      { rows: [] }, // COMMIT
    ]
    client.query.mockImplementation(() => Promise.resolve(fila.shift() || { rows: [] }))
    mockConnect.mockResolvedValue(client)

    const res = await request(app)
      .post('/api/pedidos')
      .set('Authorization', `Bearer ${token()}`)
      .send({
        ...CORPO,
        itens: [
          {
            produtoId: 1,
            quantidade: 1,
            personalizacao: {
              nome: 'frase.pdf',
              tipo: 'application/pdf',
              dados: 'data:application/pdf;base64,JVBERi0x',
            },
          },
        ],
      })

    expect(res.status).toBe(201)
    const insert = client.query.mock.calls.find(([sql]) => String(sql).includes('INSERT INTO pedidos'))
    expect(insert).toBeDefined()
    const itensGravados = insert[1][4] // coluna itens (JSONB)
    expect(itensGravados).toContain('personalizacao')
    expect(itensGravados).toContain('frase.pdf')
    expect(itensGravados).toContain('data:application/pdf;base64')
  })
})

describe('GET /api/pedidos', () => {
  it('deve recusar quem não está logado', async () => {
    const res = await request(app).get('/api/pedidos')
    expect(res.status).toBe(401)
  })

  it('deve listar apenas os pedidos do usuário logado', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [USUARIO] })
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 9, usuario_id: 1 }] })
    const res = await request(app).get('/api/pedidos').set('Authorization', `Bearer ${token()}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    const listagem = mockQuery.mock.calls.find(([sql]) => String(sql).includes('WHERE usuario_id'))
    expect(listagem).toBeDefined()
  })

  it('deve recusar ?todos=1 de quem não é admin', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [USUARIO] })
    const res = await request(app).get('/api/pedidos?todos=1').set('Authorization', `Bearer ${token()}`)
    expect(res.status).toBe(403)
    expect(res.body.erro).toContain('administradores')
  })

  it('deve listar todos os pedidos para o admin', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [ADMIN] })
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 9, usuario_id: 1, cliente_nome: 'Cliente', cliente_email: 'c@test.com' }],
    })
    const res = await request(app)
      .get('/api/pedidos?todos=1')
      .set('Authorization', `Bearer ${tokenAdmin()}`)
    expect(res.status).toBe(200)
    expect(res.body[0].cliente_nome).toBe('Cliente')
    const listagem = mockQuery.mock.calls.find(([sql]) => String(sql).includes('LEFT JOIN clientes'))
    expect(listagem).toBeDefined()
  })
})

describe('GET /api/pedidos/:id', () => {
  it('deve recusar quem não está logado', async () => {
    const res = await request(app).get('/api/pedidos/5')
    expect(res.status).toBe(401)
  })

  it('deve rejeitar id inválido', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [USUARIO] })
    const res = await request(app).get('/api/pedidos/abc').set('Authorization', `Bearer ${token()}`)
    expect(res.status).toBe(400)
  })

  it('deve entregar o pedido ao dono', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [USUARIO] })
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 5, usuario_id: 1, status: 'pendente', itens: [], cliente_endereco: 'Rua X' }],
    })
    const res = await request(app).get('/api/pedidos/5').set('Authorization', `Bearer ${token()}`)
    expect(res.status).toBe(200)
    expect(res.body.id).toBe(5)
    expect(res.body.cliente_endereco).toBe('Rua X')
  })

  it('deve recusar pedido de outro usuário', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [USUARIO] })
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 5, usuario_id: 999, itens: [] }] })
    const res = await request(app).get('/api/pedidos/5').set('Authorization', `Bearer ${token()}`)
    expect(res.status).toBe(403)
    expect(res.body.erro).toContain('permissão')
  })

  it('deve deixar o admin ver pedido de qualquer usuário', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [ADMIN] })
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 5, usuario_id: 999, itens: [] }] })
    const res = await request(app).get('/api/pedidos/5').set('Authorization', `Bearer ${tokenAdmin()}`)
    expect(res.status).toBe(200)
    expect(res.body.id).toBe(5)
  })

  it('deve devolver 404 quando o pedido não existe', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [USUARIO] })
    mockQuery.mockResolvedValueOnce({ rows: [] })
    const res = await request(app).get('/api/pedidos/5').set('Authorization', `Bearer ${token()}`)
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/pedidos/:id/status', () => {
  it('deve recusar quem não está logado', async () => {
    const res = await request(app).patch('/api/pedidos/5/status').send({ status: 'pago' })
    expect(res.status).toBe(401)
  })

  it('deve recusar mudança de quem não é admin', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [USUARIO] })
    const res = await request(app)
      .patch('/api/pedidos/5/status')
      .set('Authorization', `Bearer ${token()}`)
      .send({ status: 'pago' })
    expect(res.status).toBe(403)
    expect(mockConnect).not.toHaveBeenCalled()
  })

  it('deve rejeitar status fora da lista permitida', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [ADMIN] })
    const res = await request(app)
      .patch('/api/pedidos/5/status')
      .set('Authorization', `Bearer ${tokenAdmin()}`)
      .send({ status: 'voou' })
    expect(res.status).toBe(400)
    expect(res.body.erro).toContain('Status inválido')
  })

  it('deve atualizar o status de um pedido', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [ADMIN] })
    const client = { release: jest.fn(), query: jest.fn() }
    const fila = [
      { rows: [] }, // BEGIN
      { rows: [{ id: 5, status: 'pendente', itens: [] }] }, // SELECT FOR UPDATE
      { rows: [] }, // UPDATE pedidos
      { rows: [] }, // COMMIT
    ]
    client.query.mockImplementation(() => Promise.resolve(fila.shift() || { rows: [] }))
    mockConnect.mockResolvedValue(client)

    const res = await request(app)
      .patch('/api/pedidos/5/status')
      .set('Authorization', `Bearer ${tokenAdmin()}`)
      .send({ status: 'enviado' })

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true, id: 5, status: 'enviado' })
    const update = client.query.mock.calls.find(([sql]) =>
      String(sql).includes('UPDATE pedidos SET status')
    )
    expect(update).toBeDefined()
    expect(update[1]).toEqual(['enviado', 5])
    expect(client.release).toHaveBeenCalled()
  })

  it('deve baixar o estoque ao marcar como pago', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [ADMIN] })
    const client = { release: jest.fn(), query: jest.fn() }
    const fila = [
      { rows: [] }, // BEGIN
      { rows: [{ id: 5, status: 'pendente', itens: [{ produtoId: 1, quantidade: 2 }] }] },
      { rows: [{ id: 1, nome: 'Peça', estoque: 10 }] }, // SELECT produtos FOR UPDATE
      { rows: [] }, // baixa de estoque
      { rows: [] }, // UPDATE pedidos
      { rows: [] }, // COMMIT
    ]
    client.query.mockImplementation(() => Promise.resolve(fila.shift() || { rows: [] }))
    mockConnect.mockResolvedValue(client)

    const res = await request(app)
      .patch('/api/pedidos/5/status')
      .set('Authorization', `Bearer ${tokenAdmin()}`)
      .send({ status: 'pago' })

    expect(res.status).toBe(200)
    const baixa = client.query.mock.calls.find(([sql]) =>
      String(sql).includes('estoque = estoque - v.qtd')
    )
    expect(baixa).toBeDefined()
    expect(baixa[1]).toEqual([[1], [2]])
  })

  it('deve recusar "pago" quando não há estoque suficiente', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [ADMIN] })
    const client = { release: jest.fn(), query: jest.fn() }
    const fila = [
      { rows: [] }, // BEGIN
      { rows: [{ id: 5, status: 'pendente', itens: [{ produtoId: 1, quantidade: 5 }] }] },
      { rows: [{ id: 1, nome: 'Peça', estoque: 2 }] }, // SELECT produtos FOR UPDATE
      { rows: [] }, // ROLLBACK
    ]
    client.query.mockImplementation(() => Promise.resolve(fila.shift() || { rows: [] }))
    mockConnect.mockResolvedValue(client)

    const res = await request(app)
      .patch('/api/pedidos/5/status')
      .set('Authorization', `Bearer ${tokenAdmin()}`)
      .send({ status: 'pago' })

    expect(res.status).toBe(400)
    expect(res.body.erro).toContain('Estoque insuficiente')
    const rollback = client.query.mock.calls.find(([sql]) => String(sql) === 'ROLLBACK')
    expect(rollback).toBeDefined()
  })

  it('deve devolver o estoque ao cancelar um pedido já pago', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [ADMIN] })
    const client = { release: jest.fn(), query: jest.fn() }
    const fila = [
      { rows: [] }, // BEGIN
      { rows: [{ id: 5, status: 'pago', itens: [{ produtoId: 1, quantidade: 2 }] }] },
      { rows: [{ id: 1, nome: 'Peça', estoque: 8 }] }, // SELECT produtos FOR UPDATE
      { rows: [] }, // devolução de estoque
      { rows: [] }, // UPDATE pedidos
      { rows: [] }, // COMMIT
    ]
    client.query.mockImplementation(() => Promise.resolve(fila.shift() || { rows: [] }))
    mockConnect.mockResolvedValue(client)

    const res = await request(app)
      .patch('/api/pedidos/5/status')
      .set('Authorization', `Bearer ${tokenAdmin()}`)
      .send({ status: 'cancelado' })

    expect(res.status).toBe(200)
    const devolucao = client.query.mock.calls.find(([sql]) =>
      String(sql).includes('estoque = estoque + v.qtd')
    )
    expect(devolucao).toBeDefined()
    expect(devolucao[1]).toEqual([[1], [2]])
  })
})
