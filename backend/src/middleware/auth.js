import jwt from 'jsonwebtoken'
import pool from '../db.js'
import logger from '../logger.js'

/**
 * Carrega e valida a sessão por trás de um token.
 *
 * Além de assinar/verificar o JWT, compara `tv` (token_version) com a versão
 * gravada no usuário: trocar a senha ou chamar /logout incrementa a versão e
 * derruba TODOS os tokens emitidos antes — sem precisar de lista negra.
 * Tokens antigos (sem `tv`) são tratados como versão 0.
 */
async function sessaoDoToken(token) {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE id = $1', [payload.id])
    if (rows.length === 0) {
      return { ok: false, status: 401, erro: 'Usuário não encontrado.' }
    }
    const usuario = rows[0]
    if ((payload.tv ?? 0) !== (usuario.token_version ?? 0)) {
      logger.info({ userId: usuario.id }, 'Token recusado: sessão invalidada por troca de senha/logout')
      return { ok: false, status: 401, erro: 'Sessão expirada. Faça login novamente.' }
    }
    return { ok: true, usuario }
  } catch {
    return { ok: false, status: 401, erro: 'Sessão inválida ou expirada.' }
  }
}

function tokenDaRequisicao(req) {
  const auth = req.headers.authorization
  return auth ? auth.replace('Bearer ', '') : null
}

export async function autenticar(req, res, next) {
  const token = tokenDaRequisicao(req)
  if (!token) {
    return res.status(401).json({ erro: 'Não autenticado.' })
  }

  const sessao = await sessaoDoToken(token)
  if (!sessao.ok) {
    return res.status(sessao.status).json({ erro: sessao.erro })
  }
  req.usuario = sessao.usuario
  next()
}

export async function autenticarAdmin(req, res, next) {
  const token = tokenDaRequisicao(req)
  if (!token) {
    return res.status(401).json({ erro: 'Não autenticado.' })
  }

  const sessao = await sessaoDoToken(token)
  if (!sessao.ok) {
    return res.status(sessao.status).json({ erro: sessao.erro })
  }
  if (!sessao.usuario.admin) {
    return res.status(403).json({ erro: 'Acesso negado. Apenas administradores.' })
  }
  req.usuario = sessao.usuario
  next()
}

export function serAdmin(req, res, next) {
  if (!req.usuario || !req.usuario.admin) {
    return res.status(403).json({ erro: 'Acesso negado. Apenas administradores podem realizar esta ação.' })
  }
  next()
}

/**
 * Autentica se houver token válido, mas permite seguir como convidado.
 * Usado no checkout: quem tem conta vincula o pedido; quem não tem,
 * recebe um checkoutToken curto para pagar em seguida.
 */
export async function autenticarOpcional(req, _res, next) {
  const token = tokenDaRequisicao(req)
  if (!token) return next()

  const sessao = await sessaoDoToken(token)
  if (sessao.ok) req.usuario = sessao.usuario
  // Token ausente/inválido/sessão revogada — segue como convidado.
  next()
}

/**
 * Token de curta duração (30 min) devolvido na criação do pedido para
 * permitir que um convidado gere o pagamento sem criar conta.
 */
export function criarCheckoutToken(pedidoId) {
  return jwt.sign({ pedidoId: Number(pedidoId), escopo: 'checkout' }, process.env.JWT_SECRET, {
    expiresIn: '30m',
  })
}

export function validarCheckoutToken(token, pedidoId) {
  if (!token) return false
  try {
    const payload = jwt.verify(String(token), process.env.JWT_SECRET)
    return payload.escopo === 'checkout' && Number(payload.pedidoId) === Number(pedidoId)
  } catch {
    return false
  }
}
