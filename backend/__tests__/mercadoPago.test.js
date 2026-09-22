import crypto from 'crypto'
import { validarAssinaturaWebhook } from '../src/services/mercadoPago.js'

describe('validarAssinaturaWebhook', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    delete process.env.MP_WEBHOOK_SECRET
    delete process.env.MP_ACCESS_TOKEN
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('deve retornar false sem x-signature', () => {
    const req = { headers: {}, body: {} }
    expect(validarAssinaturaWebhook(req)).toBe(false)
  })

  it('deve retornar true quando não há secret configurado', () => {
    const req = {
      headers: { 'x-signature': 'ts=123,v1=abc' },
      body: { test: true },
    }
    expect(validarAssinaturaWebhook(req)).toBe(true)
  })

  it('deve retornar false para assinatura inválida', () => {
    process.env.MP_WEBHOOK_SECRET = 'segredo-teste'
    const req = {
      headers: { 'x-signature': 'ts=1234567890,v1=invalidsignature' },
      body: { type: 'payment', data: { id: 123 } },
    }
    expect(validarAssinaturaWebhook(req)).toBe(false)
  })

  it('deve retornar false para assinatura de outro segredo', () => {
    process.env.MP_WEBHOOK_SECRET = 'segredo-de-outro-ambiente'
    const xRequestId = 'req-456'
    const ts = '1704908010'
    const dataId = '999'
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
    const v1 = crypto.createHmac('sha256', 'segredo-diferente').update(manifest).digest('hex')
    const req = {
      headers: { 'x-signature': `ts=${ts},v1=${v1}`, 'x-request-id': xRequestId },
      body: { type: 'payment', data: { id: dataId } },
    }
    expect(validarAssinaturaWebhook(req)).toBe(false)
  })

  it('deve retornar true para assinatura válida (manifesto oficial do MP)', () => {
    process.env.MP_WEBHOOK_SECRET = 'segredo-teste'
    const xRequestId = 'req-123'
    const ts = '1704908010'
    const dataId = '999'
    // Manifesto oficial: id:{data.id};request-id:{x-request-id};ts:{ts};
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
    const v1 = crypto.createHmac('sha256', 'segredo-teste').update(manifest).digest('hex')
    const req = {
      headers: { 'x-signature': `ts=${ts},v1=${v1}`, 'x-request-id': xRequestId },
      body: { type: 'payment', data: { id: dataId } },
    }
    expect(validarAssinaturaWebhook(req)).toBe(true)
  })

  it('deve aceitar data.id vindo da query string (envio do MP)', () => {
    process.env.MP_WEBHOOK_SECRET = 'segredo-teste'
    const xRequestId = 'req-789'
    const ts = '1704908011'
    const manifest = `id:12345;request-id:${xRequestId};ts:${ts};`
    const v1 = crypto.createHmac('sha256', 'segredo-teste').update(manifest).digest('hex')
    const req = {
      headers: { 'x-signature': `ts=${ts},v1=${v1}`, 'x-request-id': xRequestId },
      body: {},
      query: { 'data.id': '12345' },
    }
    expect(validarAssinaturaWebhook(req)).toBe(true)
  })
})
