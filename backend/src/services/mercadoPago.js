import crypto from 'crypto'
import logger from '../logger.js'

const MP_BASE = 'https://api.mercadopago.com'

export function gatewayConfigurado() {
  return Boolean(process.env.MP_ACCESS_TOKEN)
}

export async function criarPreferencia({ pedidoId, total, titulo, cliente }) {
  const resposta = await fetch(`${MP_BASE}/checkout/preferences`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      items: [
        {
          title: titulo || 'Pedido Lume',
          quantity: 1,
          unit_price: Number(total),
          currency_id: 'BRL',
        },
      ],
      payer: {
        name: cliente?.nome || 'Cliente Lume',
        email: cliente?.email || '',
      },
      external_reference: String(pedidoId),
      back_urls: {
        success: process.env.CLIENTE_ORIGEM || 'http://localhost:5173',
        pending: process.env.CLIENTE_ORIGEM || 'http://localhost:5173',
        failure: process.env.CLIENTE_ORIGEM || 'http://localhost:5173',
      },
      auto_return: 'approved',
      notification_url: `${process.env.BACKEND_URL}/api/pagamentos/webhook`,
    }),
  })

  if (!resposta.ok) {
    const texto = await resposta.text()
    throw new Error(`Mercado Pago: ${resposta.status} ${texto}`)
  }

  return resposta.json()
}

export async function obterPagamento(paymentId) {
  const resposta = await fetch(`${MP_BASE}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  })
  if (!resposta.ok) {
    throw new Error(`Mercado Pago: ${resposta.status}`)
  }
  return resposta.json()
}

export function validarAssinaturaWebhook(req) {
  const xSignature = req.headers['x-signature']
  const xRequestId = req.headers['x-request-id']

  if (!xSignature) {
    logger.warn('Webhook sem header x-signature')
    return false
  }

  const secret = process.env.MP_WEBHOOK_SECRET || process.env.MP_ACCESS_TOKEN
  if (!secret) {
    logger.warn('MP_WEBHOOK_SECRET e MP_ACCESS_TOKEN não configurados — ignorando validação')
    return true
  }

  const parts = {}
  for (const part of xSignature.split(',')) {
    const [key, value] = part.split('=')
    parts[key.trim()] = value.trim()
  }

  const ts = parts.ts
  const v1 = parts.v1

  if (!ts || !v1) {
    logger.warn('Webhook assinatura com formato inválido')
    return false
  }

  const body = JSON.stringify(req.body)
  let manifest = `id:${xRequestId || ''};request-id:${xRequestId || ''};ts:${ts};body:${body};`

  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(manifest)
  const computed = hmac.digest('hex')

  if (computed !== v1) {
    logger.warn({ computed, expected: v1 }, 'Webhook assinatura inválida')
    return false
  }

  return true
}
