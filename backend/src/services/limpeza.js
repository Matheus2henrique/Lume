import pool from '../db.js'
import env from '../env.js'
import logger from '../logger.js'
import { devolverEstoque } from './estoque.js'

// Contas que nasceram no registro/login mas ninguém confirmou o código em
// 10 minutos não devem ocupar espaço no banco. Só remove pendentes —
// contas com email_verificado = TRUE nunca entram aqui.
//
// A cláusula `codigo_expira_em IS NOT NULL` é uma trava extra: só existe
// prazo a vencer em conta que realmente entrou no fluxo de código. Conta
// criada por seed/seed-admin nasce sem prazo (e verificada) e jamais pode
// ser engolida por aqui.
export async function limparContasPendentesExpiradas() {
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM usuarios
       WHERE email_verificado = FALSE
         AND codigo_expira_em IS NOT NULL
         AND codigo_expira_em < now()`
    )
    if (rowCount > 0) {
      logger.info({ quantidade: rowCount }, 'Contas pendentes expiradas removidas do banco')
    }
    return rowCount
  } catch (err) {
    logger.error({ err }, 'Erro ao limpar contas pendentes expiradas')
    return 0
  }
}

// Remove uma conta pendente específica (quando o usuário tenta usar o
// código depois do prazo e precisa do 410 na tela).
export async function removerContaPendente(id) {
  const { rowCount } = await pool.query(
    'DELETE FROM usuarios WHERE id = $1 AND email_verificado = FALSE',
    [id]
  )
  return rowCount > 0
}

/**
 * Libera a peça reservada de pedidos que ficaram 'pendente' (esperando o
 * Mercado Pago) além do prazo — PLANO 1.6. Sem isso, um carrinho abandonado
 * seguraria estoque para sempre.
 *
 * PEDIDO_EXPIRA_MINUTOS = 0 desliga. Usa FOR UPDATE SKIP LOCKED: se o webhook
 * aprovar o mesmo pedido nesse instante, um dos dois espera o outro.
 */
export async function expirarPedidosNaoPagos(minutos = env.PEDIDO_EXPIRA_MINUTOS) {
  if (!Number.isFinite(minutos) || minutos <= 0) return 0

  let client = null
  try {
    client = await pool.connect()
    await client.query('BEGIN')

    const { rows: expirados } = await client.query(
      `SELECT id, itens, estoque_reservado
         FROM pedidos
        WHERE status = 'pendente'
          AND criado_em < now() - make_interval(mins => $1)
        ORDER BY criado_em
        LIMIT 100
        FOR UPDATE SKIP LOCKED`,
      [minutos]
    )

    let estoqueDevolvido = 0
    for (const pedido of expirados) {
      // Só devolve quem segura peça (estoque_reservado) — cancelar duas vezes
      // não pode encher o estoque.
      if (pedido.estoque_reservado && (await devolverEstoque(client, pedido.itens))) {
        estoqueDevolvido++
      }
      await client.query(
        `UPDATE pedidos SET status = 'cancelado', estoque_reservado = FALSE WHERE id = $1`,
        [pedido.id]
      )
    }

    await client.query('COMMIT')
    if (expirados.length > 0) {
      logger.info(
        { quantidade: expirados.length, estoqueDevolvido, minutos },
        'Pedidos pendentes expirados: estoque liberado'
      )
    }
    return expirados.length
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {})
    logger.error({ err }, 'Erro ao expirar pedidos pendentes')
    return 0
  } finally {
    client?.release()
  }
}
