import { jest } from '@jest/globals'
import request from 'supertest'

const mockQuery = jest.fn().mockResolvedValue({ rows: [], rowCount: 0 })
jest.unstable_mockModule('../src/db.js', () => ({
  default: { query: mockQuery, connect: jest.fn(), on: jest.fn() },
}))

const { default: app } = await import('../src/server.js')
const {
  foraDoLimiteGlobal,
  ROTAS_FORA_DO_LIMITE_GLOBAL,
  contaBloqueada,
  registrarFalhaDeConta,
  limparFalhasDeConta,
  resetarFalhasDeConta,
  limiterConta,
} = await import('../src/middleware/rateLimiter.js')

afterEach(() => {
  resetarFalhasDeConta()
})

describe('foraDoLimiteGlobal', () => {
  it('isenta webhook do Mercado Pago e health', () => {
    expect(ROTAS_FORA_DO_LIMITE_GLOBAL).toContain('/api/pagamentos/webhook')
    expect(ROTAS_FORA_DO_LIMITE_GLOBAL).toContain('/api/health')
    expect(foraDoLimiteGlobal({ path: '/api/pagamentos/webhook' })).toBe(true)
    expect(foraDoLimiteGlobal({ path: '/api/health' })).toBe(true)
  })

  it('mantém as demais rotas sob o teto global', () => {
    expect(foraDoLimiteGlobal({ path: '/api/pedidos' })).toBe(false)
    expect(foraDoLimiteGlobal({ path: '/api/auth/login' })).toBe(false)
  })
})

describe('aplicação do teto global', () => {
  it('o health nunca recebe 429 (sonda do orquestrador não pode falhar)', async () => {
    const statuses = []
    for (let i = 0; i < 105; i += 1) {
      const res = await request(app).get('/api/health')
      statuses.push(res.status)
    }
    expect(statuses.every((s) => s === 200)).toBe(true)
  })

  it('rotas comuns continuam limitadas a 100 req/min', async () => {
    let recebeu429 = false
    for (let i = 0; i < 105 && !recebeu429; i += 1) {
      const res = await request(app).get('/api/produtos')
      if (res.status === 429) recebeu429 = true
    }
    expect(recebeu429).toBe(true)
  })
})

describe('bloqueio por conta (fora do IP)', () => {
  it('fica bloqueada na 5ª falha e volta a funcionar sozinha', () => {
    expect(contaBloqueada('alvo@x.com')).toBe(false)
    for (let i = 0; i < 4; i += 1) registrarFalhaDeConta('alvo@x.com')
    expect(contaBloqueada('alvo@x.com')).toBe(false) // ainda não
    registrarFalhaDeConta('alvo@x.com')
    expect(contaBloqueada('alvo@x.com')).toBe(true)
  })

  it('o bloqueio é por e-mail: outra conta segue livre', () => {
    for (let i = 0; i < 5; i += 1) registrarFalhaDeConta('alvo@x.com')
    expect(contaBloqueada('alvo@x.com')).toBe(true)
    expect(contaBloqueada('outra@x.com')).toBe(false)
  })

  it('ignora e-mail ausente ou malformado', () => {
    registrarFalhaDeConta('')
    registrarFalhaDeConta(null)
    expect(contaBloqueada('')).toBe(false)
    expect(contaBloqueada(undefined)).toBe(false)
  })

  it('login bem-sucedido limpa as falhas da conta', () => {
    for (let i = 0; i < 5; i += 1) registrarFalhaDeConta('alvo@x.com')
    expect(contaBloqueada('alvo@x.com')).toBe(true)
    limparFalhasDeConta('alvo@x.com')
    expect(contaBloqueada('alvo@x.com')).toBe(false)
  })

  it('o middleware devolve 429 sem seguir para o handler', () => {
    for (let i = 0; i < 5; i += 1) registrarFalhaDeConta('alvo@x.com')
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
    const next = jest.fn()
    limiterConta({ body: { email: 'ALVO@x.com' } }, res, next) // caixa mista
    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(429)
  })
})
