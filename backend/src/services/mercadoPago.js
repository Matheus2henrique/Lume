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
          title: titulo || 'Pedido Locus',
          quantity: 1,
          unit_price: Number(total),
          currency_id: 'BRL',
        },
      ],
      payer: {
        name: cliente?.nome || 'Cliente Locus',
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