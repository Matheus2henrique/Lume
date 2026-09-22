import jwt from 'jsonwebtoken'
import pool from '../db.js'
import logger from '../logger.js'

export async function autenticar(req, res, next) {
  const auth = req.headers.authorization
  if (!auth) {
    return res.status(401).json({ erro: 'Não autenticado.' })
  }

  const token = auth.replace('Bearer ', '')
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE id = $1', [payload.id])
    if (rows.length === 0) {
      return res.status(401).json({ erro: 'Usuário não encontrado.' })
    }
    req.usuario = rows[0]
    next()
  } catch {
    res.status(401).json({ erro: 'Sessão inválida ou expirada.' })
  }
}

export async function autenticarAdmin(req, res, next) {
  const auth = req.headers.authorization
  if (!auth) {
    return res.status(401).json({ erro: 'Não autenticado.' })
  }

  const token = auth.replace('Bearer ', '')
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE id = $1', [payload.id])
    if (rows.length === 0) {
      return res.status(401).json({ erro: 'Usuário não encontrado.' })
    }
    if (!rows[0].admin) {
      return res.status(403).json({ erro: 'Acesso negado. Apenas administradores.' })
    }
    req.usuario = rows[0]
    next()
  } catch {
    res.status(401).json({ erro: 'Sessão inválida ou expirada.' })
  }
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
  const auth = req.headers.authorization
  if (!auth) return next()

  try {
    const token = auth.replace('Bearer ', '')
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE id = $1', [payload.id])
    if (rows[0]) req.usuario = rows[0]
  } catch {
    // Token ausente/inválido — segue como convidado sem quebrar o fluxo.
  }
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
