import { Router } from 'express'
import pool from '../db.js'
import { autenticar } from '../middleware/auth.js'

const router = Router()

router.use(autenticar)

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.*
       FROM favoritos f
       JOIN produtos p ON p.id = f.produto_id
       WHERE f.usuario_id = $1
       ORDER BY f.criado_em DESC`,
      [req.usuario.id]
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Não foi possível listar os favoritos.' })
  }
})

router.post('/:produtoId', async (req, res) => {
  const produtoId = Number(req.params.produtoId)
  try {
    const { rows: produto } = await pool.query('SELECT id FROM produtos WHERE id = $1', [produtoId])
    if (produto.length === 0) {
      return res.status(404).json({ erro: 'Produto não encontrado.' })
    }
    await pool.query(
      `INSERT INTO favoritos (usuario_id, produto_id) VALUES ($1, $2)
       ON CONFLICT (usuario_id, produto_id) DO NOTHING`,
      [req.usuario.id, produtoId]
    )
    res.status(201).json({ mensagem: 'Produto adicionado aos favoritos.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Não foi possível adicionar aos favoritos.' })
  }
})

router.delete('/:produtoId', async (req, res) => {
  const produtoId = Number(req.params.produtoId)
  try {
    await pool.query(
      'DELETE FROM favoritos WHERE usuario_id = $1 AND produto_id = $2',
      [req.usuario.id, produtoId]
    )
    res.json({ mensagem: 'Produto removido dos favoritos.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Não foi possível remover dos favoritos.' })
  }
})

export default router