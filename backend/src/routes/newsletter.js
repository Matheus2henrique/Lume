import { Router } from 'express'
import pool from '../db.js'
import logger, { mascaraEmail } from '../logger.js'

const router = Router()

// LGPD: sem consentimento explícito não guarda nada — e a inscrição fica
// registrada com data/hora do aceite, para conseguir provar depois.
router.post('/', async (req, res) => {
  const { email, aceite } = req.body || {}

  if (!email || !email.includes('@')) {
    return res.status(400).json({ erro: 'Informe um e-mail válido.' })
  }
  if (aceite !== true) {
    return res
      .status(400)
      .json({ erro: 'É preciso aceitar receber novidades para se inscrever.' })
  }

  const contato = String(email).trim()
  try {
    await pool.query(
      `INSERT INTO newsletter (email, aceite, aceite_em)
       VALUES ($1, TRUE, NOW())
       ON CONFLICT (email) DO UPDATE SET aceite = TRUE, aceite_em = NOW()`,
      [contato]
    )
    logger.info({ emailMascarado: mascaraEmail(contato) }, 'Inscrição na newsletter (com aceite)')
    res.status(201).json({ mensagem: 'Inscrição confirmada!' })
  } catch (err) {
    logger.error({ err }, 'Erro ao salvar newsletter')
    res.status(500).json({ erro: 'Não foi possível completar a inscrição.' })
  }
})

export default router
