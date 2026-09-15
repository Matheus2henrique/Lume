import jwt from 'jsonwebtoken'
import pool from '../db.js'

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