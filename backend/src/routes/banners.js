import { Router } from 'express'
import pool from '../db.js'
import { autenticarAdmin } from '../middleware/auth.js'
import logger from '../logger.js'

const router = Router()

// Listagem pública: o slideshow da home consome isso sem login.
router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM banners ORDER BY ordem, id')
    res.json(rows)
  } catch (err) {
    logger.error({ err }, 'Erro ao listar banners')
    res.status(500).json({ erro: 'Não foi possível listar os banners.' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM banners WHERE id = $1', [req.params.id])
    if (rows.length === 0) {
      return res.status(404).json({ erro: 'Banner não encontrado.' })
    }
    res.json(rows[0])
  } catch (err) {
    logger.error({ err }, 'Erro ao buscar banner')
    res.status(500).json({ erro: 'Não foi possível buscar o banner.' })
  }
})

router.post('/', autenticarAdmin, async (req, res) => {
  const { genero, imagem } = req.body || {}

  if (!genero || !imagem || !String(imagem).trim()) {
    return res.status(400).json({ erro: 'Nicho e imagem são obrigatórios.' })
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO banners (genero, imagem, ordem)
       VALUES ($1, $2, (SELECT COALESCE(MAX(ordem), 0) + 1 FROM banners))
       RETURNING *`,
      [genero, String(imagem).trim()]
    )
    logger.info({ bannerId: rows[0].id, genero: rows[0].genero }, 'Banner criado')
    res.status(201).json(rows[0])
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({ erro: 'Nicho não encontrado — selecione um nicho existente.' })
    }
    logger.error({ err }, 'Erro ao criar banner')
    res.status(500).json({ erro: 'Não foi possível criar o banner.' })
  }
})

router.put('/:id', autenticarAdmin, async (req, res) => {
  const { genero, imagem } = req.body || {}

  if (!genero || !imagem || !String(imagem).trim()) {
    return res.status(400).json({ erro: 'Nicho e imagem são obrigatórios.' })
  }

  try {
    const { rows } = await pool.query(
      `UPDATE banners
       SET genero = $1, imagem = $2
       WHERE id = $3
       RETURNING *`,
      [genero, String(imagem).trim(), req.params.id]
    )
    if (rows.length === 0) {
      return res.status(404).json({ erro: 'Banner não encontrado.' })
    }
    logger.info({ bannerId: rows[0].id }, 'Banner atualizado')
    res.json(rows[0])
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({ erro: 'Nicho não encontrado — selecione um nicho existente.' })
    }
    logger.error({ err }, 'Erro ao atualizar banner')
    res.status(500).json({ erro: 'Não foi possível atualizar o banner.' })
  }
})

router.delete('/:id', autenticarAdmin, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM banners WHERE id = $1', [req.params.id])
    if (rowCount === 0) {
      return res.status(404).json({ erro: 'Banner não encontrado.' })
    }
    logger.info({ bannerId: req.params.id }, 'Banner excluído')
    res.json({ mensagem: 'Banner excluído com sucesso.' })
  } catch (err) {
    logger.error({ err }, 'Erro ao excluir banner')
    res.status(500).json({ erro: 'Não foi possível excluir o banner.' })
  }
})

export default router
