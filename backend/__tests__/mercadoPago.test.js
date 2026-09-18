import { validarAssinaturaWebhook } from '../src/services/mercadoPago.js'

describe('validarAssinaturaWebhook', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    process.env.MP_ACCESS_TOKEN = 'test-token-123'
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('deve retornar false sem x-signature', () => {
    const req = { headers: {}, body: {} }
    expect(validarAssinaturaWebhook(req)).toBe(false)
  })

  it('deve retornar true quando não há secret configurado', () => {
    delete process.env.MP_WEBHOOK_SECRET
    delete process.env.MP_ACCESS_TOKEN
    const req = {
      headers: { 'x-signature': 'ts=123,v1=abc' },
      body: { test: true },
    }
    expect(validarAssinaturaWebhook(req)).toBe(true)
  })

  it('deve retornar false para assinatura inválida', () => {
    const req = {
      headers: { 'x-signature': 'ts=1234567890,v1=invalidsignature' },
      body: { type: 'payment', data: { id: 123 } },
    }
    expect(validarAssinaturaWebhook(req)).toBe(false)
  })
})
