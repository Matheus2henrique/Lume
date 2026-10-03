import { Router } from 'express'
import pool from '../db.js'
import logger from '../logger.js'
import { autenticar } from '../middleware/auth.js'
import { limiterAvaliacao } from '../middleware/rateLimiter.js'

const router = Router()

const MAX_TEXTO = 1000

function idDoProduto(valor) {
  const id = Number(valor)
  return Number.isInteger(id) && id > 0 ? id : null
}

/**
 * GET /api/avaliacoes/:produtoId — público (leitura não precisa de sessão).
 * Devolve média e total para o cabeçalho da seção e a lista (mais recente
 * primeiro). O nome de quem avaliou vem de usuarios.nome — e-mail nunca sai.
 */
router.get('/:produtoId', async (req, res) => {
  const produtoId = idDoProduto(req.params.produtoId)
  if (!produtoId) {
    return res.status(400).json({ erro: 'Produto inválido.' })
  }

  try {
    const { rows: produtos } = await pool.query('SELECT id FROM produtos WHERE id = $1', [produtoId])
    if (produtos.length === 0) {
      return res.status(404).json({ erro: 'Produto não encontrado.' })
    }

    const { rows } = await pool.query(
      `SELECT a.id, a.nota, a.texto, a.criado_em, a.atualizado_em, u.nome
         FROM avaliacoes a
         JOIN usuarios u ON u.id = a.usuario_id
        WHERE a.produto_id = $1
        ORDER BY a.criado_em DESC
        LIMIT 200`,
      [produtoId]
    )

    const total = rows.length
    const media =
      total === 0 ? 0 : Math.round((rows.reduce((soma, a) => soma + Number(a.nota), 0) / total) * 10) / 10

    res.json({ media, total, avaliacoes: rows })
  } catch (err) {
    logger.error({ err, produtoId }, 'Erro ao listar avaliações')
    res.status(500).json({ erro: 'Não foi possível carregar as avaliações.' })
  }
})

/**
 * POST /api/avaliacoes/:produtoId — sessão obrigatória.
 * Uma avaliação por conta por produto: repetir o POST atualiza a nota/texto
 * (upsert em `UNIQUE (produto_id, usuario_id)`) em vez de criar a segunda.
 *
 * corpo: { nota: 1..5, texto: 3..1000 caracteres }
 */
router.post('/:produtoId', limiterAvaliacao, autenticar, async (req, res) => {
  const produtoId = idDoProduto(req.params.produtoId)
  if (!produtoId) {
    return res.status(400).json({ erro: 'Produto inválido.' })
  }

  const { nota, texto } = req.body || {}
  const notaNum = Number(nota)
  if (!Number.isInteger(notaNum) || notaNum < 1 || notaNum > 5) {
    return res.status(400).json({ erro: 'Nota inválida: escolha de 1 a 5 estrelas.' })
  }

  const conteudo = typeof texto === 'string' ? texto.trim() : ''
  if (conteudo.length < 3) {
    return res.status(400).json({ erro: 'Escreva um comentário de pelo menos 3 caracteres.' })
  }
  if (conteudo.length > MAX_TEXTO) {
    return res.status(400).json({ erro: `Comentário muito longo (máximo de ${MAX_TEXTO} caracteres).` })
  }

  try {
    const { rows: produtos } = await pool.query('SELECT id FROM produtos WHERE id = $1', [produtoId])
    if (produtos.length === 0) {
      return res.status(404).json({ erro: 'Produto não encontrado.' })
    }

    // xmax = 0 só é verdadeiro quando a linha nasceu neste INSERT — é isso
    // que distingue "criou" de "atualizou" para escolher 201 ou 200.
    const { rows } = await pool.query(
      `INSERT INTO avaliacoes (produto_id, usuario_id, nota, texto)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (produto_id, usuario_id)
       DO UPDATE SET nota = EXCLUDED.nota,
                     texto = EXCLUDED.texto,
                     atualizado_em = now()
       RETURNING id, nota, texto, criado_em, atualizado_em, (xmax = 0) AS criado`,
      [produtoId, req.usuario.id, notaNum, conteudo]
    )

    const avaliacao = rows[0]
    logger.info({ produtoId, usuarioId: req.usuario.id, nota: notaNum }, 'Avaliação registrada')
    res.status(avaliacao.criado ? 201 : 200).json({
      id: avaliacao.id,
      nota: Number(avaliacao.nota),
      texto: avaliacao.texto,
      criado_em: avaliacao.criado_em,
      atualizado_em: avaliacao.atualizado_em,
      nome: req.usuario.nome || 'Cliente Lume',
      criado: avaliacao.criado,
    })
  } catch (err) {
    logger.error({ err, produtoId, usuarioId: req.usuario.id }, 'Erro ao registrar avaliação')
    res.status(500).json({ erro: 'Não foi possível registrar a avaliação.' })
  }
})

export default router
