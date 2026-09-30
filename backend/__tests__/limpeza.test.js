import { jest } from '@jest/globals'

const mockQuery = jest.fn()
const mockConnect = jest.fn()
jest.unstable_mockModule('../src/db.js', () => ({
  default: { query: mockQuery, connect: mockConnect, on: jest.fn() },
}))

const { limparContasPendentesExpiradas, removerContaPendente, expirarPedidosNaoPagos } =
  await import('../src/services/limpeza.js')
const { default: env } = await import('../src/env.js')

beforeEach(() => {
  mockQuery.mockReset()
  mockConnect.mockReset()
})

describe('limpeza de contas pendentes', () => {
  it('deve apagar apenas contas não verificadas com prazo estourado', async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 3, rows: [] })
    const total = await limparContasPendentesExpiradas()
    expect(total).toBe(3)
    const [sql] = mockQuery.mock.calls[0]
    expect(String(sql)).toContain('email_verificado = FALSE')
    expect(String(sql)).toContain('codigo_expira_em')
    expect(String(sql)).toContain('DELETE FROM usuarios')
  })

  it('nunca apaga conta sem prazo de código (admin de seed nasce assim)', async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 0, rows: [] })
    await limparContasPendentesExpiradas()
    const [sql] = mockQuery.mock.calls[0]
    expect(String(sql)).toContain('codigo_expira_em IS NOT NULL')
    expect(String(sql)).not.toContain('codigo_expira_em IS NULL OR')
  })

  it('deve retornar 0 sem lançar quando o banco falhar', async () => {
    mockQuery.mockRejectedValueOnce(new Error('db off'))
    const total = await limparContasPendentesExpiradas()
    expect(total).toBe(0)
  })

  it('removerContaPendente só remove se a conta ainda estiver pendente', async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 1, rows: [] })
    const ok = await removerContaPendente(42)
    expect(ok).toBe(true)
    const [sql, params] = mockQuery.mock.calls[0]
    expect(String(sql)).toContain('email_verificado = FALSE')
    expect(params).toEqual([42])
  })

  it('removerContaPendente devolve false quando nada foi apagado', async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 0, rows: [] })
    const ok = await removerContaPendente(42)
    expect(ok).toBe(false)
  })
})

describe('expiração de pedidos pendentes (reserva de estoque)', () => {
  it('cancela pedidos vencidos e devolve a peça reservada', async () => {
    const itens = [{ produtoId: 1, quantidade: 2 }]
    const client = { release: jest.fn(), query: jest.fn() }
    const fila = [
      { rows: [] }, // BEGIN
      { rows: [{ id: 9, estoque_reservado: true, itens }] }, // SELECT ... SKIP LOCKED
      { rows: [{ id: 1, nome: 'Peça', estoque: 8 }] }, // SELECT produtos FOR UPDATE
      { rows: [] }, // devolução de estoque
      { rows: [] }, // UPDATE pedidos -> cancelado
      { rows: [] }, // COMMIT
    ]
    client.query.mockImplementation(() => Promise.resolve(fila.shift() || { rows: [] }))
    mockConnect.mockResolvedValue(client)

    const total = await expirarPedidosNaoPagos()
    expect(total).toBe(1)

    const busca = client.query.mock.calls.find(([sql]) => String(sql).includes('FROM pedidos'))
    expect(busca[0]).toContain("status = 'pendente'")
    expect(busca[0]).toContain('SKIP LOCKED')
    expect(busca[1]).toEqual([env.PEDIDO_EXPIRA_MINUTOS])

    const devolucao = client.query.mock.calls.find(([sql]) =>
      String(sql).includes('estoque = estoque + v.qtd')
    )
    expect(devolucao).toBeDefined()
    expect(devolucao[1]).toEqual([[1], [2]])

    const cancela = client.query.mock.calls.find(([sql]) =>
      String(sql).includes("status = 'cancelado'")
    )
    expect(cancela[0]).toContain('estoque_reservado = FALSE')
    expect(cancela[1]).toEqual([9])
    expect(client.release).toHaveBeenCalled()
  })

  it('não devolve estoque de quem nunca reservou a peça', async () => {
    const client = { release: jest.fn(), query: jest.fn() }
    const fila = [
      { rows: [] }, // BEGIN
      { rows: [{ id: 9, estoque_reservado: false, itens: [{ produtoId: 1, quantidade: 2 }] }] },
      { rows: [] }, // UPDATE pedidos -> cancelado
      { rows: [] }, // COMMIT
    ]
    client.query.mockImplementation(() => Promise.resolve(fila.shift() || { rows: [] }))
    mockConnect.mockResolvedValue(client)

    const total = await expirarPedidosNaoPagos()
    expect(total).toBe(1)

    const devolucoes = client.query.mock.calls.filter(([sql]) =>
      String(sql).includes('estoque = estoque + v.qtd')
    )
    expect(devolucoes).toHaveLength(0)
  })

  it('fica desligado com PEDIDO_EXPIRA_MINUTOS=0', async () => {
    const total = await expirarPedidosNaoPagos(0)
    expect(total).toBe(0)
    expect(mockConnect).not.toHaveBeenCalled()
  })

  it('devolve 0 sem lançar quando o banco falhar', async () => {
    mockConnect.mockRejectedValueOnce(new Error('db off'))
    const total = await expirarPedidosNaoPagos()
    expect(total).toBe(0)
  })
})
