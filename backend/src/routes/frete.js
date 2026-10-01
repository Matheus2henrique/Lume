import { Router } from 'express'
import pool from '../db.js'
import logger from '../logger.js'
import { limiterFrete } from '../middleware/rateLimiter.js'
import {
  freteAtivo,
  normalizarCep,
  montarProdutosCotacao,
  pacotePadrao,
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
 * POST /api/frete/calcular — cotação de frete para um CEP.
 * Público e com teto próprio: cada chamada consome cota na API do Melhor
 * Envio, então o rate limit é a proteção (30/min por IP). Atende o
 * simulador da home (sem itens) e o checkout (com os itens do carrinho).
 * O CEP de origem da loja nunca sai daqui — só o do cliente é devolvido.
 *
 * corpo: { cep: "01310-100", itens?: [{ produtoId, quantidade }] }
 * resposta: { ativo, cep, pacote: 'carrinho'|'padrao', opcoes: [{ servicoId, servico, valor, prazoMin, prazoMax, transportadora, logo }] }
 */
router.post('/calcular', limiterFrete, async (req, res) => {
  if (!freteAtivo()) {
    return res.json({ ativo: false, cep: null, pacote: null, opcoes: [] })
  }

  const { cep, itens } = req.body || {}
  const cepDestino = normalizarCep(cep)
  if (!cepDestino) {
    return res.status(400).json({ erro: 'CEP inválido. Informe 8 dígitos.' })
  }

  // Sem `itens` é a simulação da home: cota a encomenda padrão.
  const temItens = itens !== undefined && itens !== null
  if (temItens && (!Array.isArray(itens) || itens.length === 0)) {
    return res.status(400).json({ erro: 'Carrinho vazio.' })
  }
  for (const item of temItens ? itens : []) {
    const produtoId = Number(item?.produtoId)
    if (
      !Number.isInteger(produtoId) ||
      produtoId <= 0 ||
      !Number.isInteger(item?.quantidade) ||
      item.quantidade <= 0 ||
      item.quantidade > 999
    ) {
      return res.status(400).json({ erro: 'Item do carrinho inválido.' })
    }
  }

  try {
    let products = []
    let pacote = 'padrao'

    if (temItens) {
      const ids = [...new Set(itens.map((item) => Number(item.produtoId)))]
      const { rows: produtos } = await pool.query('SELECT * FROM produtos WHERE id = ANY($1)', ids)
      const porId = new Map(produtos.map((p) => [p.id, p]))

      for (const id of ids) {
        if (!porId.has(id)) {
          return res.status(400).json({ erro: `Produto ${id} não encontrado.` })
        }
      }

      products = montarProdutosCotacao(itens, porId)
      if (products.length === 0) {
        return res.status(400).json({ erro: 'Nenhum produto válido para cotar o frete.' })
      }
      pacote = 'carrinho'
    }

    if (products.length === 0) {
      products = [pacotePadrao()]
    }

    const opcoes = await calcularFrete(cepDestino, products)
    res.json({ ativo: true, cep: cepDestino, pacote, opcoes })
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
