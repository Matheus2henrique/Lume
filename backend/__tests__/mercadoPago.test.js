import crypto from 'crypto'
import { validarAssinaturaWebhook, timestampFresco } from '../src/services/mercadoPago.js'

// Assinatura válida: manifesto oficial do MP assinado com o segredo do teste.
function assinar({ segredo, dataId, xRequestId, ts }) {
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
  return crypto.createHmac('sha256', segredo).update(manifest).digest('hex')
}

function requisicao({ segredo, dataId, xRequestId, ts }) {
  const v1 = assinar({ segredo, dataId, xRequestId, ts })
  return {
    headers: { 'x-signature': `ts=${ts},v1=${v1}`, 'x-request-id': xRequestId },
    body: { type: 'payment', data: { id: dataId } },
  }
}

describe('validarAssinaturaWebhook', () => {
  const originalEnv = process.env
  const agora = Date.now()

  beforeEach(() => {
    process.env = { ...originalEnv }
    delete process.env.MP_WEBHOOK_SECRET
    delete process.env.MP_ACCESS_TOKEN
    process.env.NODE_ENV = 'test'
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('deve retornar false sem x-signature', () => {
    const req = { headers: {}, body: {} }
    expect(validarAssinaturaWebhook(req)).toBe(false)
  })

  it('sem secret em desenvolvimento: pula a validação (com aviso)', () => {
    const req = {
      headers: { 'x-signature': `ts=${agora},v1=abc` },
      body: { test: true },
    }
    expect(validarAssinaturaWebhook(req)).toBe(true)
  })

  it('sem secret em produção: REJEITA o webhook', () => {
    process.env.NODE_ENV = 'production'
    const req = {
      headers: { 'x-signature': `ts=${agora},v1=abc` },
      body: { test: true },
    }
    expect(validarAssinaturaWebhook(req)).toBe(false)
  })

  it('deve retornar false para assinatura inválida', () => {
    process.env.MP_WEBHOOK_SECRET = 'segredo-teste'
    const req = {
      headers: { 'x-signature': `ts=${agora},v1=invalidsignature` },
      body: { type: 'payment', data: { id: 123 } },
    }
    expect(validarAssinaturaWebhook(req)).toBe(false)
  })

  it('deve retornar false para assinatura de outro segredo', () => {
    process.env.MP_WEBHOOK_SECRET = 'segredo-teste'
    const req = requisicao({
      segredo: 'segredo-diferente',
      dataId: '999',
      xRequestId: 'req-456',
      ts: agora,
    })
    expect(validarAssinaturaWebhook(req)).toBe(false)
  })

  it('deve retornar true para assinatura válida (manifesto oficial do MP)', () => {
    process.env.MP_WEBHOOK_SECRET = 'segredo-teste'
    const req = requisicao({
      segredo: 'segredo-teste',
      dataId: '999',
      xRequestId: 'req-123',
      ts: agora,
    })
    expect(validarAssinaturaWebhook(req)).toBe(true)
  })

  it('deve aceitar data.id vindo da query string (envio do MP)', () => {
    process.env.MP_WEBHOOK_SECRET = 'segredo-teste'
    const ts = agora
    const v1 = assinar({ segredo: 'segredo-teste', dataId: '12345', xRequestId: 'req-789', ts })
    const req = {
      headers: { 'x-signature': `ts=${ts},v1=${v1}`, 'x-request-id': 'req-789' },
      body: {},
      query: { 'data.id': '12345' },
    }
    expect(validarAssinaturaWebhook(req)).toBe(true)
  })

  it('deve aceitar ts em segundos (formato de documentação antiga)', () => {
    process.env.MP_WEBHOOK_SECRET = 'segredo-teste'
    const ts = String(Math.floor(Date.now() / 1000))
    const v1 = assinar({ segredo: 'segredo-teste', dataId: '777', xRequestId: 'req-sec', ts })
    const req = {
      headers: { 'x-signature': `ts=${ts},v1=${v1}`, 'x-request-id': 'req-sec' },
      body: { type: 'payment', data: { id: '777' } },
    }
    expect(validarAssinaturaWebhook(req)).toBe(true)
  })

  it('deve recusar replay: ts antigo demais', () => {
    process.env.MP_WEBHOOK_SECRET = 'segredo-teste'
    const ts = String(Date.now() - 20 * 60 * 1000)
    const v1 = assinar({ segredo: 'segredo-teste', dataId: '555', xRequestId: 'req-velho', ts })
    const req = {
      headers: { 'x-signature': `ts=${ts},v1=${v1}`, 'x-request-id': 'req-velho' },
      body: { type: 'payment', data: { id: '555' } },
    }
    expect(validarAssinaturaWebhook(req)).toBe(false)
  })

  it('deve recusar ts no futuro (fora da tolerância)', () => {
    process.env.MP_WEBHOOK_SECRET = 'segredo-teste'
    const ts = String(Date.now() + 20 * 60 * 1000)
    const v1 = assinar({ segredo: 'segredo-teste', dataId: '556', xRequestId: 'req-futuro', ts })
    const req = {
      headers: { 'x-signature': `ts=${ts},v1=${v1}`, 'x-request-id': 'req-futuro' },
      body: { type: 'payment', data: { id: '556' } },
    }
    expect(validarAssinaturaWebhook(req)).toBe(false)
  })
})

describe('timestampFresco', () => {
  const agora = 1_760_000_000_000 // ms

  it('aceita ms dentro da janela', () => {
    expect(timestampFresco(String(agora - 60_000), agora)).toBe(true)
  })

  it('aceita segundos convertidos para ms', () => {
    expect(timestampFresco(String(Math.floor((agora - 60_000) / 1000)), agora)).toBe(true)
  })

  it('rejeita valor não numérico ou zero', () => {
    expect(timestampFresco('abc', agora)).toBe(false)
    expect(timestampFresco('0', agora)).toBe(false)
    expect(timestampFresco('', agora)).toBe(false)
  })

  it('rejeita fora da tolerância de 10 minutos', () => {
    expect(timestampFresco(String(agora - 11 * 60_000), agora)).toBe(false)
    expect(timestampFresco(String(agora + 11 * 60_000), agora)).toBe(false)
  })
})
