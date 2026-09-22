import { Router } from 'express'
import pool from '../db.js'
import { autenticarAdmin } from '../middleware/auth.js'
import logger from '../logger.js'

const router = Router()

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM generos ORDER BY nome')
    res.json(rows)
  } catch (err) {
    logger.error({ err }, 'Erro ao listar gêneros')
    res.status(500).json({ erro: 'Não foi possível listar os gêneros.' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM generos WHERE id = $1', [req.params.id])
    if (rows.length === 0) {
      return res.status(404).json({ erro: 'Gênero não encontrado.' })
    }
    res.json(rows[0])
  } catch (err) {
    logger.error({ err }, 'Erro ao buscar gênero')
    res.status(500).json({ erro: 'Não foi possível buscar o gênero.' })
  }
})

router.post('/', autenticarAdmin, async (req, res) => {
  const { id, nome, tagline, descricao, imagem } = req.body || {}

  if (!id || !nome) {
    return res.status(400).json({ erro: 'ID e nome são obrigatórios.' })
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO generos (id, nome, tagline, descricao, imagem)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, nome, tagline || '', descricao || '', imagem || '']
    )
    logger.info({ generoId: rows[0].id }, 'Gênero criado')
    res.status(201).json(rows[0])
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ erro: 'Já existe um gênero com este ID.' })
    }
    logger.error({ err }, 'Erro ao criar gênero')
    res.status(500).json({ erro: 'Não foi possível criar o gênero.' })
  }
})

router.put('/:id', autenticarAdmin, async (req, res) => {
  const { nome, tagline, descricao, imagem } = req.body || {}

  if (!nome) {
    return res.status(400).json({ erro: 'Nome é obrigatório.' })
  }

  try {
    const { rows } = await pool.query(
      `UPDATE generos
       SET nome = $1, tagline = $2, descricao = $3, imagem = $4
       WHERE id = $5
       RETURNING *`,
      [nome, tagline || '', descricao || '', imagem || '', req.params.id]
    )
    if (rows.length === 0) {
      return res.status(404).json({ erro: 'Gênero não encontrado.' })
    }
    logger.info({ generoId: rows[0].id }, 'Gênero atualizado')
    res.json(rows[0])
  } catch (err) {
    logger.error({ err }, 'Erro ao atualizar gênero')
    res.status(500).json({ erro: 'Não foi possível atualizar o gênero.' })
  }
})

router.delete('/:id', autenticarAdmin, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM generos WHERE id = $1', [req.params.id])
    if (rowCount === 0) {
      return res.status(404).json({ erro: 'Gênero não encontrado.' })
    }
    logger.info({ generoId: req.params.id }, 'Gênero excluído')
    res.json({ mensagem: 'Gênero excluído com sucesso.' })
  } catch (err) {
    logger.error({ err }, 'Erro ao excluir gênero')
    res.status(500).json({ erro: 'Não foi possível excluir o gênero.' })
  }
})

export default router
