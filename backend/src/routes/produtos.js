import { Router } from 'express'
import pool from '../db.js'
import { autenticarAdmin } from '../middleware/auth.js'
import logger from '../logger.js'

const router = Router()

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM produtos ORDER BY id')
    res.json(rows)
  } catch (err) {
    logger.error({ err }, 'Erro ao listar produtos')
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
    logger.error({ err }, 'Erro ao buscar produto')
    res.status(500).json({ erro: 'Não foi possível buscar o produto.' })
  }
})

router.post('/', autenticarAdmin, async (req, res) => {
  const { nome, genero, tipo, preco, estoque, permite_upload, permiteUpload, descricao, imagem } = req.body || {}

  if (!nome || !genero || preco === undefined) {
    return res.status(400).json({ erro: 'Nome, nicho e preço são obrigatórios.' })
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO produtos (nome, genero, tipo, preco, estoque, permite_upload, descricao, imagem)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [nome, genero, tipo || 'decoracao', preco, estoque || 0, permiteUpload ?? permite_upload ?? false, descricao || '', imagem || '']
    )
    logger.info({ produtoId: rows[0].id }, 'Produto criado')
    res.status(201).json(rows[0])
  } catch (err) {
    logger.error({ err }, 'Erro ao criar produto')
    res.status(500).json({ erro: 'Não foi possível criar o produto.' })
  }
})

router.put('/:id', autenticarAdmin, async (req, res) => {
  const { nome, genero, tipo, preco, estoque, permite_upload, permiteUpload, descricao, imagem } = req.body || {}

  if (!nome || !genero || preco === undefined) {
    return res.status(400).json({ erro: 'Nome, nicho e preço são obrigatórios.' })
  }

  try {
    const { rows } = await pool.query(
      `UPDATE produtos
       SET nome = $1, genero = $2, tipo = $3, preco = $4, estoque = $5, permite_upload = $6, descricao = $7, imagem = $8
       WHERE id = $9
       RETURNING *`,
      [nome, genero, tipo || 'decoracao', preco, estoque || 0, permiteUpload ?? permite_upload ?? false, descricao || '', imagem || '', req.params.id]
    )
    if (rows.length === 0) {
      return res.status(404).json({ erro: 'Produto não encontrado.' })
    }
    logger.info({ produtoId: rows[0].id }, 'Produto atualizado')
    res.json(rows[0])
  } catch (err) {
    logger.error({ err }, 'Erro ao atualizar produto')
    res.status(500).json({ erro: 'Não foi possível atualizar o produto.' })
  }
})

router.delete('/:id', autenticarAdmin, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM produtos WHERE id = $1', [req.params.id])
    if (rowCount === 0) {
      return res.status(404).json({ erro: 'Produto não encontrado.' })
    }
    logger.info({ produtoId: Number(req.params.id) }, 'Produto excluído')
    res.json({ mensagem: 'Produto excluído com sucesso.' })
  } catch (err) {
    logger.error({ err }, 'Erro ao excluir produto')
    res.status(500).json({ erro: 'Não foi possível excluir o produto.' })
  }
})

export default router
