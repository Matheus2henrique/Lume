import { Router } from 'express'
import pool from '../db.js'
import logger from '../logger.js'
import { limiterFrete } from '../middleware/rateLimiter.js'
import {
  freteAtivo,
  normalizarCep,
  montarProdutosCotacao,
  calcularFrete,
  erroParaResposta,
} from '../services/melhorEnvio.js'

const router = Router()

/**
 * GET /api/frete/status — público, sem custo.
 * O frontend pergunta "frete ligado?" para mostrar/esconder a seção de
 * entrega. Sem token configurado o site segue sem frete (como hoje).
 */
router.get('/status', (_req, res) => {
  res.json({ ativo: freteAtivo() })
})

/**
 * POST /api/frete/calcular — cotação de um carrinho para um CEP.
 * Público (a tela de carrinho roda antes do login) com teto próprio:
 * cada chamada consome cota na API do Melhor Envio.
 *
 * corpo: { cep: "01310-100", itens: [{ produtoId, quantidade }] }
 * resposta: { ativo: true, cep, opcoes: [{ servicoId, servico, valor, prazoMin, prazoMax, transportadora, logo }] }
 */
router.post('/calcular', limiterFrete, async (req, res) => {
  if (!freteAtivo()) {
    return res.json({ ativo: false, cep: null, opcoes: [] })
  }

  const { cep, itens } = req.body || {}
  const cepDestino = normalizarCep(cep)
  if (!cepDestino) {
    return res.status(400).json({ erro: 'CEP inválido. Informe 8 dígitos.' })
  }
  if (!Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ erro: 'Carrinho vazio.' })
  }
  for (const item of itens) {
    if (!item?.produtoId || !Number.isInteger(item?.quantidade) || item.quantidade <= 0 || item.quantidade > 999) {
      return res.status(400).json({ erro: 'Item do carrinho inválido.' })
    }
  }

  try {
    const ids = [...new Set(itens.map((item) => Number(item.produtoId)))]
    const { rows: produtos } = await pool.query('SELECT * FROM produtos WHERE id = ANY($1)', ids)
    const porId = new Map(produtos.map((p) => [p.id, p]))

    for (const id of ids) {
      if (!porId.has(id)) {
        return res.status(400).json({ erro: `Produto ${id} não encontrado.` })
      }
    }

    const products = montarProdutosCotacao(itens, porId)
    if (products.length === 0) {
      return res.status(400).json({ erro: 'Nenhum produto válido para cotar o frete.' })
    }

    const opcoes = await calcularFrete(cepDestino, products)
    res.json({ ativo: true, cep: cepDestino, opcoes })
  } catch (err) {
    if (err.timeout) {
      logger.warn({ erro: err.message }, 'Melhor Envio: tempo esgotado na cotação')
    } else if (Number.isInteger(err.status) && err.status < 500) {
      logger.warn({ status: err.status }, 'Melhor Envio recusou a cotação')
    } else {
      logger.error({ err }, 'Erro inesperado na cotação de frete')
    }
    const { status, erro } = erroParaResposta(err)
    res.status(status).json({ erro })
  }
})

export default router
