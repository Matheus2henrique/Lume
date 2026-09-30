import crypto from 'crypto'
import env from '../env.js'
import logger from '../logger.js'

const MP_BASE = 'https://api.mercadopago.com'

// Sem timeout, uma chamada pendurada segura o worker e a conexão do pool.
// MP_TIMEOUT_MS existe para testes/ajuste fino em produção.
export const TIMEOUT_MP_MS =
  Number(process.env.MP_TIMEOUT_MS) > 0 ? Number(process.env.MP_TIMEOUT_MS) : 10_000

export function gatewayConfigurado() {
  return Boolean(process.env.MP_ACCESS_TOKEN)
}

/** Chamada única ao Mercado Pago: bearer, timeout e erro legível. */
async function chamarMp(caminho, { metodo = 'GET', corpo } = {}) {
  let resposta
  try {
    resposta = await fetch(`${MP_BASE}${caminho}`, {
      method: metodo,
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        ...(corpo ? { 'Content-Type': 'application/json' } : {}),
      },
      body: corpo ? JSON.stringify(corpo) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MP_MS),
    })
  } catch (err) {
    if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
      const timeout = new Error(`Mercado Pago: tempo esgotado após ${TIMEOUT_MP_MS} ms (${caminho})`)
      timeout.cause = err
      timeout.timeout = true
      throw timeout
    }
    throw err
  }

  if (!resposta.ok) {
    const texto = await resposta.text().catch(() => '')
    throw new Error(`Mercado Pago: ${resposta.status} ${texto}`.trim())
  }
  return resposta.json()
}

// Para onde o Mercado Pago devolve o cliente: a tela de status do pedido
// (/Lume/pedido/:id), que acompanha a confirmação do pagamento.
function urlStatusPedido(pedidoId) {
  const origem = (env.CLIENTE_ORIGEM || 'http://localhost:5173').split(',')[0].trim().replace(/\/+$/, '')
  return `${origem}/Lume/pedido/${pedidoId}`
}

export async function criarPreferencia({ pedidoId, total, titulo, cliente }) {
  return chamarMp('/checkout/preferences', {
    metodo: 'POST',
    corpo: {
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
    },
  })
}

export async function obterPagamento(paymentId) {
  return chamarMp(`/v1/payments/${paymentId}`)
}

/**
 * Consulta uma preferência já criada. Usada para reutilizar o mesmo
 * init_point em vez de gerar uma preferência nova a cada clique
 * (ver routes/pagamentos.js).
 */
export async function obterPreferencia(preferenciaId) {
  return chamarMp(`/checkout/preferences/${preferenciaId}`)
}

/**
 * Valida a assinatura enviada pelo Mercado Pago no header x-signature.
 *
 * Manifesto oficial (docs do MP): id:{data.id};request-id:{x-request-id};ts:{ts};
 * assinado com HMAC-SHA256 usando o SEGREDO gerado no painel do Mercado Pago
 * (Suas integrações > Webhooks > Configurar notificação > revelar chave),
 * configurado em MP_WEBHOOK_SECRET.
 *
 * Regras:
 *  • produção com pagamento ativo exige o segredo (também bloqueado em env.js);
 *    sem ele o webhook é RECUSADO, nunca aceito às cegas;
 *  • o timestamp da assinatura precisa estar dentro da janela de tolerância,
 *    para impedir replay de uma notificação antiga capturada;
 *  • a segurança adicional vem de consultar o pagamento na API do MP antes de
 *    aprovar e de conferir o valor pago (ver routes/pagamentos.js).
 */
export const TOLERANCIA_TS_MS = 10 * 60 * 1000

// O MP envia ts em milissegundos; documentação antiga e exemplos de teste
// aparecem em segundos. Detecta a unidade para não rejeitar por engano.
function tsEmMillisegundos(ts) {
  const valor = Number(ts)
  if (!Number.isFinite(valor) || valor <= 0) return null
  return valor < 1e12 ? valor * 1000 : valor
}

export function timestampFresco(ts, agora = Date.now()) {
  const ms = tsEmMillisegundos(ts)
  if (ms === null) return false
  return Math.abs(agora - ms) <= TOLERANCIA_TS_MS
}

export function validarAssinaturaWebhook(req) {
  const xSignature = req.headers['x-signature']
  const xRequestId = req.headers['x-request-id']

  if (!xSignature) {
    logger.warn('Webhook sem header x-signature')
    return false
  }

  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      logger.error(
        'MP_WEBHOOK_SECRET não configurado — webhook REJEITADO em produção. ' +
          'Gere o segredo no painel do Mercado Pago (Suas integrações > Webhooks).'
      )
      return false
    }
    logger.warn(
      'MP_WEBHOOK_SECRET não configurado — validação de assinatura ignorada (somente desenvolvimento).'
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

  if (!timestampFresco(ts)) {
    logger.warn({ requestId: xRequestId || null }, 'Assinatura do webhook fora da janela de tolerância (replay)')
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
