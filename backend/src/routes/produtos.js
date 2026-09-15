import { Router } from 'express'
import pool from '../db.js'

const router = Router()

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM produtos ORDER BY id')
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Não foi possível listar os produtos.' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM produtos WHERE id = $1', [req.params.id])
    if (rows.length === 0) {
      return res.status(404).json({ erro: 'Produto não encontrado.' })
    }
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Não foi possível buscar o produto.' })
  }
})

export default router