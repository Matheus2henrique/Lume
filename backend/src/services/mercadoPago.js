import crypto from 'crypto'
import env from '../env.js'
import logger from '../logger.js'

const MP_BASE = 'https://api.mercadopago.com'

export function gatewayConfigurado() {
  return Boolean(process.env.MP_ACCESS_TOKEN)
}

// Para onde o Mercado Pago devolve o cliente: a tela de status do pedido
// (/Lume/pedido/:id), que acompanha a confirmação do pagamento.
function urlStatusPedido(pedidoId) {
  const origem = (env.CLIENTE_ORIGEM || 'http://localhost:5173').split(',')[0].trim().replace(/\/+$/, '')
  return `${origem}/Lume/pedido/${pedidoId}`
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
        success: urlStatusPedido(pedidoId),
        pending: urlStatusPedido(pedidoId),
        failure: urlStatusPedido(pedidoId),
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

/**
 * Valida a assinatura enviada pelo Mercado Pago no header x-signature.
 *
 * Manifesto oficial (docs do MP): id:{data.id};request-id:{x-request-id};ts:{ts};
 * assinado com HMAC-SHA256 usando o SEGREDO gerado no painel do Mercado Pago
 * (Suas integrações > Webhooks > Configurar notificação > revelar chave),
 * configurado em MP_WEBHOOK_SECRET.
 *
 * Sem o segredo configurado, a validação é ignorada com aviso — a segurança
 * principal vem de consultar o pagamento na API do MP antes de aprovar
 * (ver routes/pagamentos.js) e de conferir o valor pago.
 */
export function validarAssinaturaWebhook(req) {
  const xSignature = req.headers['x-signature']
  const xRequestId = req.headers['x-request-id']

  if (!xSignature) {
    logger.warn('Webhook sem header x-signature')
    return false
  }

  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) {
    logger.warn(
      'MP_WEBHOOK_SECRET não configurado — validação de assinatura ignorada. ' +
        'Configure o segredo do painel do Mercado Pago antes de ir para produção.'
    )
    return true
  }

  const partes = {}
  for (const parte of String(xSignature).split(',')) {
    const [chave, ...valor] = parte.split('=')
    if (chave && valor.length > 0) partes[chave.trim()] = valor.join('=').trim()
  }
  const { ts, v1 } = partes

  if (!ts || !v1) {
    logger.warn('Webhook com assinatura em formato inválido')
    return false
  }

  // O MP envia o id do pagamento no corpo (data.id) e também na query (data.id).
  const dataId = req.body?.data?.id ?? req.query?.['data.id'] ?? req.query?.id ?? ''
  const manifest =
    [
      dataId !== '' && dataId != null ? `id:${dataId}` : null,
      xRequestId ? `request-id:${xRequestId}` : null,
      `ts:${ts}`,
    ]
      .filter(Boolean)
      .join(';') + ';'

  const esperado = crypto.createHmac('sha256', secret).update(manifest).digest('hex')
  const a = Buffer.from(esperado, 'utf8')
  const b = Buffer.from(v1, 'utf8')
  const confere = a.length === b.length && crypto.timingSafeEqual(a, b)

  if (!confere) {
    // Nunca logar os valores do HMAC — apenas o fato da falha.
    logger.warn({ requestId: xRequestId || null }, 'Assinatura do webhook inválida')
  }
  return confere
}
