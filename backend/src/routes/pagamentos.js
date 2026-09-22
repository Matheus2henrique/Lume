import { Router } from 'express'
import pool from '../db.js'
import { gatewayConfigurado, criarPreferencia, obterPagamento, validarAssinaturaWebhook } from '../services/mercadoPago.js'
import { autenticarOpcional, validarCheckoutToken } from '../middleware/auth.js'
import { limiterPagamento } from '../middleware/rateLimiter.js'
import logger from '../logger.js'

const router = Router()

// Status do Mercado Pago que encerram o pedido como não pago.
// "pending"/"in_process"/"authorized" NÃO estão aqui: são normais no Pix
// e o pedido deve permanecer pendente até a confirmação.
const STATUS_FALHA = new Set(['rejected', 'cancelled', 'expired'])

router.get('/status', (_req, res) => {
  res.json({ gateway: gatewayConfigurado() })
})

router.post('/preferencia', autenticarOpcional, limiterPagamento, async (req, res) => {
  if (!gatewayConfigurado()) {
    return res.status(503).json({
      erro: 'Configure o MP_ACCESS_TOKEN no arquivo .env para ativar o pagamento pelo Mercado Pago.',
    })
  }

  const pedidoId = Number(req.body?.pedidoId)
  if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
    return res.status(400).json({ erro: 'Dados do pedido inválidos.' })
  }

  const { titulo, cliente, checkoutToken } = req.body || {}

  try {
    const { rows } = await pool.query(
      'SELECT id, usuario_id, total, status FROM pedidos WHERE id = $1',
      [pedidoId]
    )
    if (rows.length === 0) {
      return res.status(404).json({ erro: 'Pedido não encontrado.' })
    }
    const pedido = rows[0]

    // Pedido logado: só o dono pode pagar.
    // Pedido de convidado (sem usuario_id): exige o token de checkout
    // devolvido na criação do pedido.
    if (pedido.usuario_id != null) {
      if (!req.usuario || req.usuario.id !== pedido.usuario_id) {
        return res.status(403).json({ erro: 'Sem permissão para pagar este pedido.' })
      }
    } else if (!validarCheckoutToken(checkoutToken, pedido.id)) {
      return res.status(403).json({ erro: 'Token de checkout inválido ou expirado. Refaça a compra.' })
    }

    if (pedido.status === 'pago') {
      return res.status(409).json({ erro: 'Este pedido já foi pago.' })
    }
    if (pedido.status === 'cancelado') {
      return res.status(409).json({ erro: 'Este pedido foi cancelado.' })
    }

    // O valor cobrado vem SEMPRE do banco — nunca do corpo da requisição.
    const total = Number(pedido.total)

    const preferencia = await criarPreferencia({ pedidoId: pedido.id, total, titulo, cliente })
    await pool.query(
      `UPDATE pedidos
       SET pagamento = jsonb_set(COALESCE(pagamento, '{}'::jsonb), '{preferencia_id}', to_jsonb($1::text))
       WHERE id = $2`,
      [String(preferencia.id), pedido.id]
    )
    logger.info({ pedidoId: pedido.id, userId: req.usuario?.id ?? null }, 'Preferência de pagamento criada')
    res.json({ init_point: preferencia.init_point, preferencia_id: preferencia.id })
  } catch (err) {
    logger.error({ err, pedidoId }, 'Erro ao criar preferência de pagamento')
    res.status(502).json({ erro: 'Não foi possível iniciar o pagamento no Mercado Pago.' })
  }
})

router.post('/webhook', async (req, res) => {
  if (!validarAssinaturaWebhook(req)) {
    return res.status(401).json({ ok: false, erro: 'Assinatura inválida.' })
  }

  const { type, data } = req.body || {}
  if (type !== 'payment' || !data?.id) {
    return res.status(400).json({ ok: false, erro: 'Notificação inválida.' })
  }

  // A fonte da verdade é a API do Mercado Pago: consultamos o pagamento
  // com o nosso token antes de alterar qualquer pedido.
  let pagamento
  try {
    pagamento = await obterPagamento(data.id)
  } catch (err) {
    logger.error({ err, paymentId: data.id }, 'Erro ao consultar pagamento no MP')
    return res.status(502).json({ ok: false, erro: 'Não foi possível consultar o pagamento.' })
  }

  const pedidoId = Number(pagamento.external_reference)
  if (!pedidoId) {
    return res.status(400).json({ ok: false, erro: 'Pedido não identificado.' })
  }

  let client = null
  try {
    client = await pool.connect()
    await client.query('BEGIN')

    const { rows } = await client.query(
      'SELECT * FROM pedidos WHERE id = $1 FOR UPDATE',
      [pedidoId]
    )
    if (rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ ok: false, erro: 'Pedido não encontrado.' })
    }
    const pedido = rows[0]

    // Idempotência: notificação repetida não altera um pedido já pago.
    if (pedido.status === 'pago') {
      await client.query('COMMIT')
      return res.status(200).json({ ok: true, ignorado: 'pedido já pago' })
    }

    const valorPago = Number(pagamento.transaction_amount)
    const valorPedido = Number(pedido.total)

    if (pagamento.status === 'approved') {
      // Só aprova se o valor cobrado bater com o valor do pedido.
      const valorConfere = Number.isFinite(valorPago) && Math.abs(valorPago - valorPedido) <= 0.005
      if (!valorConfere) {
        logger.error(
          { pedidoId, valorPago, valorPedido, paymentId: pagamento.id },
          'VALOR PAGO DIVERGENTE — pedido não aprovado automaticamente'
        )
        await client.query('COMMIT')
        return res.status(200).json({ ok: true, alerta: 'valor divergente — revisão manual' })
      }

      // Baixa de estoque com lock de linha; sinaliza quando faltar peça
      // (o pagamento já ocorreu — não dá para recusar, só avisar).
      const itens = Array.isArray(pedido.itens) ? pedido.itens : []
      const baixa = new Map()
      for (const item of itens) {
        if (!item?.produtoId) continue
        baixa.set(item.produtoId, (baixa.get(item.produtoId) || 0) + Number(item.quantidade || 0))
      }
      const ids = [...baixa.keys()].sort((a, b) => a - b)
      let alertaEstoque = false

      if (ids.length > 0) {
        const { rows: produtos } = await client.query(
          'SELECT id, nome, estoque FROM produtos WHERE id = ANY($1) ORDER BY id FOR UPDATE',
          [ids]
        )
        const porId = new Map(produtos.map((p) => [p.id, p]))
        const idsBaixa = []
        const quantidadesBaixa = []

        for (const id of ids) {
          const produto = porId.get(id)
          const quantidade = baixa.get(id)
          if (!produto || produto.estoque < quantidade) {
            alertaEstoque = true
            logger.error(
              { pedidoId, produtoId: id, disponivel: produto?.estoque ?? 0, pedido: quantidade },
              'Estoque insuficiente na aprovação do pedido'
            )
            continue
          }
          idsBaixa.push(id)
          quantidadesBaixa.push(quantidade)
        }

        if (idsBaixa.length > 0) {
          await client.query(
            `UPDATE produtos SET estoque = estoque - v.qtd
             FROM (SELECT UNNEST($1::int[]) AS id, UNNEST($2::int[]) AS qtd) AS v
             WHERE produtos.id = v.id`,
            [idsBaixa, quantidadesBaixa]
          )
        }
      }

      const novoPagamento = {
        ...(pedido.pagamento || {}),
        status: 'aprovado',
        gateway: 'mercado_pago',
        gateway_pagamento_id: String(pagamento.id),
        valor_pago: valorPago,
        ...(alertaEstoque ? { alerta_estoque: true } : {}),
      }

      await client.query(
        `UPDATE pedidos SET status = 'pago', pagamento = $1::jsonb WHERE id = $2`,
        [JSON.stringify(novoPagamento), pedidoId]
      )
      logger.info({ pedidoId, paymentId: pagamento.id, alertaEstoque }, 'Pagamento aprovado e estoque baixado')
    } else if (STATUS_FALHA.has(pagamento.status)) {
      // Cancela apenas em recusa definitiva.
      await client.query(`UPDATE pedidos SET status = 'cancelado' WHERE id = $1`, [pedidoId])
      logger.info({ pedidoId, statusMP: pagamento.status }, 'Pagamento recusado — pedido cancelado')
    } else {
      logger.info(
        { pedidoId, statusMP: pagamento.status },
        'Pagamento ainda em processamento — pedido mantido pendente'
      )
    }

    await client.query('COMMIT')
    res.status(200).json({ ok: true })
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {})
    logger.error({ err, pedidoId }, 'Erro ao processar webhook')
    if (!res.headersSent) {
      res.status(500).json({ ok: false, erro: 'Não foi possível processar o pagamento.' })
    }
  } finally {
    client?.release()
  }
})

router.get('/webhook', (_req, res) => {
  res.send('ok')
})

export default router
