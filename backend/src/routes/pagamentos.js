import { Router } from 'express'
import pool from '../db.js'
import {
  gatewayConfigurado,
  criarPreferencia,
  obterPagamento,
  obterPreferencia,
  validarAssinaturaWebhook,
} from '../services/mercadoPago.js'
import { autenticar, validarCheckoutToken } from '../middleware/auth.js'
import { somarPorProduto, travarProdutos, conferir, aplicar, devolverEstoque } from '../services/estoque.js'
import { limiterPagamento, limiterWebhook } from '../middleware/rateLimiter.js'
import logger from '../logger.js'

const router = Router()

// Status do Mercado Pago que encerram o pedido como não pago.
// "pending"/"in_process"/"authorized" NÃO estão aqui: são normais no Pix
// e o pedido deve permanecer pendente até a confirmação.
const STATUS_FALHA = new Set(['rejected', 'cancelled', 'expired'])

router.get('/status', (_req, res) => {
  res.json({ gateway: gatewayConfigurado() })
})

// Pagamento exige sessão: só o dono (logado) consegue gerar a cobrança.
router.post('/preferencia', autenticar, limiterPagamento, async (req, res) => {
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
      'SELECT id, usuario_id, total, status, pagamento FROM pedidos WHERE id = $1',
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

    // Idempotência da cobrança: cada chamada ao MP cria uma preferência nova
    // (e um link de pagamento a mais). Se já existe uma para este pedido,
    // reutiliza o init_point — só cria outra se o MP não a devolver.
    let preferencia = null
    const preferenciaAnterior = pedido.pagamento?.preferencia_id
    if (preferenciaAnterior) {
      try {
        const anterior = await obterPreferencia(preferenciaAnterior)
        if (anterior?.init_point && String(anterior.external_reference) === String(pedido.id)) {
          preferencia = anterior
          logger.info(
            { pedidoId: pedido.id, preferenciaId: anterior.id },
            'Preferência de pagamento reutilizada'
          )
        }
      } catch (err) {
        logger.warn(
          { err: err.message, pedidoId: pedido.id, preferenciaId: preferenciaAnterior },
          'Preferência anterior indisponível — criando uma nova'
        )
      }
    }

    if (!preferencia) {
      preferencia = await criarPreferencia({ pedidoId: pedido.id, total, titulo, cliente })
      await pool.query(
        `UPDATE pedidos
         SET pagamento = jsonb_set(COALESCE(pagamento, '{}'::jsonb), '{preferencia_id}', to_jsonb($1::text))
         WHERE id = $2`,
        [String(preferencia.id), pedido.id]
      )
      logger.info({ pedidoId: pedido.id, userId: req.usuario?.id ?? null }, 'Preferência de pagamento criada')
    }

    res.json({ init_point: preferencia.init_point, preferencia_id: preferencia.id })
  } catch (err) {
    logger.error({ err, pedidoId }, 'Erro ao criar preferência de pagamento')
    if (err?.timeout) {
      return res.status(504).json({ erro: 'O Mercado Pago não respondeu a tempo. Tente novamente.' })
    }
    res.status(502).json({ erro: 'Não foi possível iniciar o pagamento no Mercado Pago.' })
  }
})

// Limite próprio (o teto global pula esta rota): reenvio do MP não pode
// virar 429 — mas flood continua bloqueado.
router.post('/webhook', limiterWebhook, async (req, res) => {
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
    // 504 em timeout: o MP trata 5xx como falha e reenvia a notificação.
    const status = err?.timeout ? 504 : 502
    return res.status(status).json({
      ok: false,
      erro: err?.timeout
        ? 'Tempo esgotado ao consultar o Mercado Pago.'
        : 'Não foi possível consultar o pagamento.',
    })
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

      // Reserva: o pedido novo já baixou o estoque na criação — aqui só
      // baixamos pedido legado (criado antes da reserva). O lock de linha
      // garante consistência; se faltar peça, o pagamento já ocorreu e não
      // dá para recusar: só avisar (alerta_estoque).
      const jaReservado = pedido.estoque_reservado === true
      const mapa = somarPorProduto(pedido.itens)
      let alertaEstoque = false

      if (!jaReservado && mapa.size > 0) {
        const produtos = await travarProdutos(client, mapa)
        const faltando = conferir(produtos, mapa)
        if (faltando.length > 0) {
          alertaEstoque = true
          for (const p of faltando) {
            logger.error(
              { pedidoId, produtoId: p.produtoId, disponivel: p.disponivel, pedido: p.pedido },
              'Estoque insuficiente na aprovação do pedido'
            )
          }
          // Baixa só o que couber (o pedido já está pago).
        }
        const paraBaixar = new Map(mapa)
        for (const p of faltando) paraBaixar.delete(p.produtoId)
        await aplicar(client, paraBaixar, false)
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
        `UPDATE pedidos SET status = 'pago', estoque_reservado = TRUE, pagamento = $1::jsonb WHERE id = $2`,
        [JSON.stringify(novoPagamento), pedidoId]
      )
      logger.info(
        { pedidoId, paymentId: pagamento.id, alertaEstoque, jaReservado },
        jaReservado ? 'Pagamento aprovado (estoque já reservado)' : 'Pagamento aprovado e estoque baixado'
      )
    } else if (STATUS_FALHA.has(pagamento.status)) {
      // Cancela apenas em recusa definitiva.
      // A devolução da peça é condicionada a estoque_reservado: a flag vira
      // FALSE ANTES do estoque subir, então uma notificação repetida do MP
      // nunca devolve a mesma peça duas vezes.
      const { rows: liberados } = await client.query(
        `UPDATE pedidos SET estoque_reservado = FALSE
          WHERE id = $1 AND estoque_reservado = TRUE
          RETURNING itens`,
        [pedidoId]
      )
      if (liberados[0]) {
        await devolverEstoque(client, liberados[0].itens)
      }
      await client.query(
        `UPDATE pedidos SET status = 'cancelado' WHERE id = $1 AND status <> 'cancelado'`,
        [pedidoId]
      )
      logger.info(
        { pedidoId, statusMP: pagamento.status, estoqueDevolvido: liberados.length > 0 },
        'Pagamento recusado — pedido cancelado'
      )
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
