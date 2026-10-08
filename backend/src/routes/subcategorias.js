import { Router } from 'express'
import pool from '../db.js'
import { autenticarAdmin } from '../middleware/auth.js'
import logger from '../logger.js'

const router = Router()

function slugificar(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60)
}

// O id é gravado em produtos.subcategoria, então tem que ser único na tabela
// inteira (o nicho também entra no slug para não colidir entre nichos).
async function idUnico(genero, nome, ignorando) {
  const base = slugificar(`${genero} ${nome}`) || 'subpasta'
  let candidato = base
  let numero = 2
  for (;;) {
    const { rows } = await pool.query('SELECT 1 FROM subcategorias WHERE id = $1 AND id <> $2', [candidato, ignorando || ''])
    if (rows.length === 0) return candidato
    candidato = `${base}-${numero}`
    numero += 1
  }
}

router.get('/', async (req, res) => {
  try {
    const { genero } = req.query
    const { rows } = genero
      ? await pool.query('SELECT * FROM subcategorias WHERE genero = $1 ORDER BY ordem, nome', [genero])
      : await pool.query('SELECT * FROM subcategorias ORDER BY genero, ordem, nome')
    res.json(rows)
  } catch (err) {
    logger.error({ err }, 'Erro ao listar subpastas')
    res.status(500).json({ erro: 'Não foi possível listar as subpastas.' })
  }
})

router.post('/', autenticarAdmin, async (req, res) => {
  const { genero, nome, icone, descricao } = req.body || {}

  if (!genero || !nome || !String(nome).trim()) {
    return res.status(400).json({ erro: 'Nicho e nome da subpasta são obrigatórios.' })
  }

  try {
    const id = await idUnico(genero, nome)
    const { rows } = await pool.query(
      `INSERT INTO subcategorias (id, genero, nome, icone, descricao, ordem)
       VALUES ($1, $2, $3, $4, $5, (SELECT COALESCE(MAX(ordem), 0) + 1 FROM subcategorias WHERE genero = $2))
       RETURNING *`,
      [id, genero, String(nome).trim(), icone || '', descricao || '']
    )
    logger.info({ subcategoriaId: rows[0].id }, 'Subpasta criada')
    res.status(201).json(rows[0])
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({ erro: 'Nicho não encontrado — selecione um nicho existente.' })
    }
    logger.error({ err }, 'Erro ao criar subpasta')
    res.status(500).json({ erro: 'Não foi possível criar a subpasta.' })
  }
})

// O id nunca é alterado: produtos.subcategoria aponta para ele.
router.put('/:id', autenticarAdmin, async (req, res) => {
  const { nome, icone, descricao, ordem } = req.body || {}

  if (!nome || !String(nome).trim()) {
    return res.status(400).json({ erro: 'Nome da subpasta é obrigatório.' })
  }

  try {
    const { rows } = await pool.query(
      `UPDATE subcategorias
       SET nome = $1, icone = $2, descricao = $3, ordem = COALESCE($4, ordem)
       WHERE id = $5
       RETURNING *`,
      [String(nome).trim(), icone || '', descricao || '', Number.isFinite(Number(ordem)) ? Number(ordem) : null, req.params.id]
    )
    if (rows.length === 0) {
      return res.status(404).json({ erro: 'Subpasta não encontrada.' })
    }
    logger.info({ subcategoriaId: rows[0].id }, 'Subpasta atualizada')
    res.json(rows[0])
  } catch (err) {
    logger.error({ err }, 'Erro ao atualizar subpasta')
    res.status(500).json({ erro: 'Não foi possível atualizar a subpasta.' })
  }
})

router.delete('/:id', autenticarAdmin, async (req, res) => {
  const cliente = await pool.connect()
  try {
    await cliente.query('BEGIN')
    // Produto que perdia a subpasta volta para o filtro "TODOS" da página.
    await cliente.query('UPDATE produtos SET subcategoria = $1 WHERE subcategoria = $2', ['', req.params.id])
    const { rowCount } = await cliente.query('DELETE FROM subcategorias WHERE id = $1', [req.params.id])
    if (rowCount === 0) {
      await cliente.query('ROLLBACK')
      return res.status(404).json({ erro: 'Subpasta não encontrada.' })
    }
    await cliente.query('COMMIT')
    logger.info({ subcategoriaId: req.params.id }, 'Subpasta excluída')
    res.json({ mensagem: 'Subpasta excluída com sucesso.' })
  } catch (err) {
    await cliente.query('ROLLBACK')
    logger.error({ err }, 'Erro ao excluir subpasta')
    res.status(500).json({ erro: 'Não foi possível excluir a subpasta.' })
  } finally {
    cliente.release()
  }
})

export default router
