import { Router } from 'express'
import pool from '../db.js'
import logger from '../logger.js'

const router = Router()

router.post('/', async (req, res) => {
  const { email } = req.body || {}

  if (!email || !email.includes('@')) {
    return res.status(400).json({ erro: 'Informe um e-mail válido.' })
  }

  try {
    await pool.query(
      `INSERT INTO newsletter (email) VALUES ($1) ON CONFLICT (email) DO NOTHING`,
      [email.trim()]
    )
    logger.info({ email: email.trim() }, 'Inscrição na newsletter')
    res.status(201).json({ mensagem: 'Inscrição confirmada!' })
  } catch (err) {
    logger.error({ err }, 'Erro ao salvar newsletter')
    res.status(500).json({ erro: 'Não foi possível completar a inscrição.' })
  }
})

export default router
