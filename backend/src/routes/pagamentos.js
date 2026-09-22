:import { Router } from 'express'
import pool from '../db.js'
import { gatewayConfigurado, criarPreferencia, obterPagamento, validarAssinaturaWebhook } from '../services/mercadoPago.js'
import { autenticar } from '../middleware/auth.js'
import { limiterPagamento } from '../middleware/rateLimiter.js'
import logger from '../logger.js'

const router = Router()

router.get('/status', (_req, res) => {
  res.json({ gateway: gatewayConfigurado() })
})

router.post('/preferencia', autenticar, limiterPagamento, async (req, res) => {
  if (!gatewayConfigurado()) {
    return res.status(503).json({
      erro: 'Configure o MP_ACCESS_TOKEN no arquivo .env para ativar o pagamento pelo Mercado Pago.',
    })
  }

  const { pedidoId, total, titulo, cliente } = req.body || {}
  if (!pedidoId || typeof total !== 'number' || total <= 0) {
    return res.status(400).json({ erro: 'Dados do pedido inválidos.' })
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, usuario_id FROM pedidos WHERE id = $1',
      [pedidoId]
    )
    if (rows.length === 0) {
      return res.status(404).json({ erro: 'Pedido não encontrado.' })
    }
    if (rows[0].usuario_id !== req.usuario.id) {
      return res.status(403).json({ erro: 'Sem permissão para acessar este pedido.' })
    }

    const preferencia = await criarPreferencia({ pedidoId, total, titulo, cliente })
    await pool.query(
      `UPDATE pedidos
       SET pagamento = jsonb_set(COALESCE(pagamento, '{}'::jsonb), '{preferencia_id}', to_jsonb($1::text))
       WHERE id = $2`,
      [String(preferencia.id), pedidoId]
    )
    logger.info({ pedidoId, userId: req.usuario.id }, 'Preferência de pagamento criada')
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

  const client = await pool.connect()
  try {
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

    if (pagamento.status === 'approved') {
      if (pedido.status !== 'pago') {
        const pagamentoAtual = pedido.pagamento || {}
        const novoPagamento = {
          ...pagamentoAtual,
          status: 'aprovado',
          gateway_pagamento_id: String(pagamento.id),
          gateway: 'mercado_pago',
        }
        await client.query(
          `UPDATE pedidos SET status = 'pago', pagamento = $1::jsonb WHERE id = $2`,
          [JSON.stringify(novoPagamento), pedidoId]
        )

        const itens = Array.isArray(pedido.itens) ? pedido.itens : []
        if (itens.length > 0) {
          const ids = itens.map((item) => item.produtoId)
          const quantidades = itens.map((item) => item.quantidade)

          await client.query(
            `UPDATE produtos SET estoque = estoque - v.qtd
             FROM (SELECT UNNEST($1::int[]) AS id, UNNEST($2::int[]) AS qtd) AS v
             WHERE produtos.id = v.id`,
            [ids, quantidades]
          )
        }

        logger.info({ pedidoId, paymentId: pagamento.id }, 'Pagamento aprovado e estoque baixado')
      }
    } else {
      await client.query(`UPDATE pedidos SET status = 'cancelado' WHERE id = $1`, [pedidoId])
      logger.info({ pedidoId, status: pagamento.status }, 'Pagamento não aprovado — pedido cancelado')
    }

    await client.query('COMMIT')
    res.status(200).json({ ok: true })
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    logger.error({ err, pedidoId }, 'Erro ao processar webhook')
    res.status(500).json({ ok: false, erro: 'Não foi possível processar o pagamento.' })
  } finally {
    client.release()
  }
})

router.get('/webhook', (_req, res) => {
  res.send('ok')
})

export default router
