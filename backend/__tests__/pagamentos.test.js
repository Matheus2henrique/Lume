import { jest } from '@jest/globals'
import request from 'supertest'
import jwt from 'jsonwebtoken'

const mockQuery = jest.fn()
const mockConnect = jest.fn()
jest.unstable_mockModule('../src/db.js', () => ({
  default: { query: mockQuery, connect: mockConnect, on: jest.fn() },
}))

const mockCriarPreferencia = jest.fn()
const mockObterPreferencia = jest.fn()
const mockObterPagamento = jest.fn()
let gatewayLigado = true
let assinaturaValida = false
jest.unstable_mockModule('../src/services/mercadoPago.js', () => ({
  gatewayConfigurado: () => gatewayLigado,
  criarPreferencia: mockCriarPreferencia,
  obterPreferencia: mockObterPreferencia,
  obterPagamento: mockObterPagamento,
  validarAssinaturaWebhook: jest.fn(() => assinaturaValida),
}))

const { default: app } = await import('../src/server.js')
const { limiterPagamento, limiterWebhook } = await import('../src/middleware/rateLimiter.js')

const USUARIO = { id: 1, nome: 'Teste', email: 'teste@test.com', admin: false }

function token() {
  return jwt.sign({ id: USUARIO.id, email: USUARIO.email, tv: 0 }, process.env.JWT_SECRET, {
    expiresIn: '5m',
  })
}

function pedido(overrides = {}) {
  return {
    id: 5,
    usuario_id: 1,
    total: 100,
    status: 'pendente',
    pagamento: null,
    ...overrides,
  }
}

beforeEach(() => {
  mockQuery.mockReset()
  mockConnect.mockReset()
  mockCriarPreferencia.mockReset()
  mockObterPreferencia.mockReset()
  mockObterPagamento.mockReset()
  gatewayLigado = true
  assinaturaValida = false
  for (const ip of ['127.0.0.1', '::1', '::ffff:127.0.0.1']) {
    limiterPagamento.resetKey(ip)
    limiterWebhook.resetKey(ip)
  }
})

async function cobrar(corpo = { pedidoId: 5 }, pedidoResposta) {
  mockQuery.mockResolvedValueOnce({ rows: [USUARIO] }) // autenticação
  if (pedidoResposta) mockQuery.mockResolvedValueOnce(pedidoResposta)
  return request(app)
    .post('/api/pagamentos/preferencia')
    .set('Authorization', `Bearer ${token()}`)
    .send(corpo)
}

describe('POST /api/pagamentos/preferencia', () => {
  it('reutiliza a preferência já criada para o mesmo pedido', async () => {
    mockObterPreferencia.mockResolvedValueOnce({
      id: 'MP-123',
      init_point: 'https://mp.org/checkout/MP-123',
      external_reference: '5',
    })

    const res = await cobrar(
      { pedidoId: 5 },
      { rows: [pedido({ pagamento: { preferencia_id: 'MP-123' } })] }
    )

    expect(res.status).toBe(200)
    expect(res.body.preferencia_id).toBe('MP-123')
    expect(res.body.init_point).toContain('MP-123')
    expect(mockCriarPreferencia).not.toHaveBeenCalled()
    // Não gravou outra preferência no banco.
    const updates = mockQuery.mock.calls.filter(([sql]) => String(sql).includes('preferencia_id'))
    expect(updates).toHaveLength(0)
  })

  it('cria uma nova quando o MP não devolve a preferência anterior', async () => {
    mockObterPreferencia.mockRejectedValueOnce(new Error('404 não achou'))
    mockCriarPreferencia.mockResolvedValueOnce({
      id: 'MP-999',
      init_point: 'https://mp.org/checkout/MP-999',
    })

    const res = await cobrar(
      { pedidoId: 5 },
      { rows: [pedido({ pagamento: { preferencia_id: 'MP-123' } })] }
    )

    expect(res.status).toBe(200)
    expect(res.body.preferencia_id).toBe('MP-999')
    expect(mockCriarPreferencia).toHaveBeenCalledTimes(1)
    const update = mockQuery.mock.calls.find(([sql]) => String(sql).includes('preferencia_id'))
    expect(update).toBeDefined()
    expect(update[1]).toEqual(['MP-999', 5])
  })

  it('cobre o valor do banco, nunca o do corpo da requisição', async () => {
    mockCriarPreferencia.mockResolvedValueOnce({ id: 'MP-1', init_point: 'https://mp.org/1' })

    await cobrar({ pedidoId: 5, total: 1 }, { rows: [pedido({ total: 100 })] })

    expect(mockCriarPreferencia).toHaveBeenCalledWith(
      expect.objectContaining({ pedidoId: 5, total: 100 })
    )
  })

  it('recusa pagar pedido de outra pessoa', async () => {
    const res = await cobrar({ pedidoId: 5 }, { rows: [pedido({ usuario_id: 999 })] })
    expect(res.status).toBe(403)
    expect(mockCriarPreferencia).not.toHaveBeenCalled()
  })

  it('recusa pedido já pago', async () => {
    const res = await cobrar({ pedidoId: 5 }, { rows: [pedido({ status: 'pago' })] })
    expect(res.status).toBe(409)
    expect(mockCriarPreferencia).not.toHaveBeenCalled()
  })

  it('responde 503 quando o gateway não está configurado', async () => {
    gatewayLigado = false
    mockQuery.mockResolvedValueOnce({ rows: [USUARIO] })
    const res = await request(app)
      .post('/api/pagamentos/preferencia')
      .set('Authorization', `Bearer ${token()}`)
      .send({ pedidoId: 5 })
    expect(res.status).toBe(503)
    expect(mockCriarPreferencia).not.toHaveBeenCalled()
  })

  it('devolve 404 quando o pedido não existe', async () => {
    const res = await cobrar({ pedidoId: 5 }, { rows: [] })
    expect(res.status).toBe(404)
    expect(mockCriarPreferencia).not.toHaveBeenCalled()
  })
})

describe('POST /api/pagamentos/webhook', () => {
  function clienteComFila(fila) {
    const client = { release: jest.fn(), query: jest.fn() }
    client.query.mockImplementation(() => Promise.resolve(fila.shift() || { rows: [] }))
    mockConnect.mockResolvedValue(client)
    return client
  }

  function notificarPagamento(status, transaction_amount = 100) {
    assinaturaValida = true
    mockObterPagamento.mockResolvedValueOnce({
      id: 111,
      status,
      transaction_amount,
      external_reference: '5',
    })
    return request(app)
      .post('/api/pagamentos/webhook')
      .send({ type: 'payment', data: { id: '111' } })
  }

  it('ignora notificação cuja assinatura é inválida', async () => {
    const res = await request(app)
      .post('/api/pagamentos/webhook')
      .send({ type: 'payment', data: { id: '1' } })
    expect(res.status).toBe(401)
    expect(mockConnect).not.toHaveBeenCalled()
  })

  it('aprova sem baixar estoque de novo quando a peça já foi reservada', async () => {
    const client = clienteComFila([
      { rows: [] }, // BEGIN
      {
        rows: [
          pedido({
            estoque_reservado: true,
            itens: [{ produtoId: 1, quantidade: 2 }],
          }),
        ],
      }, // SELECT FOR UPDATE
      { rows: [] }, // UPDATE pedidos -> pago
      { rows: [] }, // COMMIT
    ])

    const res = await notificarPagamento('approved')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)

    const baixas = client.query.mock.calls.filter(([sql]) =>
      String(sql).includes('estoque = estoque - v.qtd')
    )
    expect(baixas).toHaveLength(0)

    const update = client.query.mock.calls.find(([sql]) =>
      String(sql).includes("UPDATE pedidos SET status = 'pago'")
    )
    expect(update).toBeDefined()
    expect(update[0]).toContain('estoque_reservado = TRUE')
    expect(update[1][1]).toBe(5)
    expect(client.release).toHaveBeenCalled()
  })

  it('baixa o estoque de pedido legado aprovado (criado antes da reserva)', async () => {
    const client = clienteComFila([
      { rows: [] }, // BEGIN
      {
        rows: [
          pedido({
            estoque_reservado: false,
            itens: [{ produtoId: 1, quantidade: 2 }],
          }),
        ],
      }, // SELECT FOR UPDATE
      { rows: [{ id: 1, nome: 'Peça', estoque: 10 }] }, // SELECT produtos FOR UPDATE
      { rows: [] }, // baixa de estoque
      { rows: [] }, // UPDATE pedidos -> pago
      { rows: [] }, // COMMIT
    ])

    const res = await notificarPagamento('approved')
    expect(res.status).toBe(200)

    const baixa = client.query.mock.calls.find(([sql]) =>
      String(sql).includes('estoque = estoque - v.qtd')
    )
    expect(baixa).toBeDefined()
    expect(baixa[1]).toEqual([[1], [2]])
  })

  it('rejeição devolve a peça reservada e cancela o pedido', async () => {
    const itens = [{ produtoId: 1, quantidade: 2 }]
    const client = clienteComFila([
      { rows: [] }, // BEGIN
      { rows: [pedido({ estoque_reservado: true, itens })] }, // SELECT FOR UPDATE
      { rows: [{ itens }] }, // UPDATE estoque_reservado -> FALSE (RETURNING)
      { rows: [{ id: 1, nome: 'Peça', estoque: 8 }] }, // SELECT produtos FOR UPDATE
      { rows: [] }, // devolução de estoque
      { rows: [] }, // UPDATE pedidos -> cancelado
      { rows: [] }, // COMMIT
    ])

    const res = await notificarPagamento('rejected')
    expect(res.status).toBe(200)

    const devolucao = client.query.mock.calls.find(([sql]) =>
      String(sql).includes('estoque = estoque + v.qtd')
    )
    expect(devolucao).toBeDefined()
    expect(devolucao[1]).toEqual([[1], [2]])

    const solta = client.query.mock.calls.find(([sql]) =>
      String(sql).includes('estoque_reservado = FALSE')
    )
    expect(solta).toBeDefined()
    expect(solta[0].indexOf('estoque_reservado = FALSE')).toBeLessThan(
      String(client.query.mock.calls.find(([sql]) => String(sql).includes('estoque = estoque +'))[0]).indexOf(
        'estoque = estoque +'
      )
    )
  })

  it('notificação de rejeição repetida não devolve o estoque duas vezes', async () => {
    const client = clienteComFila([
      { rows: [] }, // BEGIN
      {
        rows: [
          pedido({ estoque_reservado: false, status: 'cancelado', itens: [{ produtoId: 1, quantidade: 2 }] }),
        ],
      }, // SELECT FOR UPDATE
      { rows: [] }, // UPDATE flag: nada a liberar
      { rows: [] }, // UPDATE status: já cancelado
      { rows: [] }, // COMMIT
    ])

    const res = await notificarPagamento('rejected')
    expect(res.status).toBe(200)

    const devolucoes = client.query.mock.calls.filter(([sql]) =>
      String(sql).includes('estoque = estoque + v.qtd')
    )
    expect(devolucoes).toHaveLength(0)
  })

  it('mantém pendente quando o pagamento ainda está em processamento', async () => {
    const client = clienteComFila([
      { rows: [] }, // BEGIN
      { rows: [pedido({ estoque_reservado: true, itens: [{ produtoId: 1, quantidade: 2 }] })] },
      { rows: [] }, // COMMIT
    ])

    const res = await notificarPagamento('in_process')
    expect(res.status).toBe(200)

    const alteracoes = client.query.mock.calls.filter(
      ([sql]) => String(sql).includes('UPDATE pedidos') && !String(sql).includes('estoque')
    )
    expect(alteracoes).toHaveLength(0)
  })
})
