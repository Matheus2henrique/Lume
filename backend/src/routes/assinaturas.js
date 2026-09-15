import { Router } from 'express'
import pool from '../db.js'
import { autenticar } from '../middleware/auth.js'

const router = Router()

router.use(autenticar)

router.post('/', async (req, res) => {
  const { planoId, nomePlano, preco, mundos } = req.body || {}

  if (!planoId || !nomePlano || typeof preco !== 'number' || !Array.isArray(mundos) || mundos.length === 0) {
    return res.status(400).json({ erro: 'Dados da assinatura inválidos.' })
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO assinaturas (usuario_id, plano_id, nome_plano, preco, mundos)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.usuario.id, planoId, nomePlano, preco, JSON.stringify(mundos)]
    )
    res.status(201).json({ assinatura: rows[0], mensagem: 'Assinatura ativada com sucesso!' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Não foi possível criar a assinatura.' })
  }
})

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM assinaturas WHERE usuario_id = $1 ORDER BY criado_em DESC',
      [req.usuario.id]
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Não foi possível listar as assinaturas.' })
  }
})

export default router