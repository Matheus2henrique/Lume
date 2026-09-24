import pool from '../db.js'
import logger from '../logger.js'

// Contas que nasceram no registro/login mas ninguém confirmou o código em
// 10 minutos não devem ocupar espaço no banco. Só remove pendentes —
// contas com email_verificado = TRUE nunca entram aqui.
export async function limparContasPendentesExpiradas() {
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM usuarios
       WHERE email_verificado = FALSE
         AND (codigo_expira_em IS NULL OR codigo_expira_em < now())`
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
