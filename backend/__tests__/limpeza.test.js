import { jest } from '@jest/globals'

const mockQuery = jest.fn()
jest.unstable_mockModule('../src/db.js', () => ({
  default: { query: mockQuery, connect: jest.fn(), on: jest.fn() },
}))

const { limparContasPendentesExpiradas, removerContaPendente } = await import(
  '../src/services/limpeza.js'
)

beforeEach(() => {
  mockQuery.mockReset()
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
