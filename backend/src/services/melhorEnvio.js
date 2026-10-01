import env from '../env.js'
import logger from '../logger.js'

/**
 * Melhor Envio — cotação de frete (Fase 1, ver MELHOR_ENVIO.md).
 *
 * Papel do módulo: só COTAR. Comprar etiqueta, gerar PDF e rastrear são
 * fases futuras. O token mora no backend (nunca no frontend) e as chamadas
 * passam por aqui para centralizar timeout, headers obrigatórios
 * (User-Agent com contato) e erros legíveis.
 *
 * Ativação: ME_TOKEN + ME_CEP_ORIGEM preenchidos. Sem isso o site segue
 * sem frete — mesma filosofia do MP_ACCESS_TOKEN vazio.
 */

const URL_BASE = {
  sandbox: 'https://sandbox.melhorenvio.com.br',
  production: 'https://melhorenvio.com.br',
}

// Sem timeout, uma chamada pendurada segura o worker. ME_TIMEOUT_MS existe
// para testes/ajuste fino (mesmo padrão do MP_TIMEOUT_MS).
export const TIMEOUT_ME_MS =
  Number(process.env.ME_TIMEOUT_MS) > 0 ? Number(process.env.ME_TIMEOUT_MS) : 10_000

/** Frete ligado? Token + CEP de origem são obrigatórios para cotar. */
export function freteAtivo() {
  return Boolean(process.env.ME_TOKEN && process.env.ME_CEP_ORIGEM)
}

/** "01310-100" → "01310100". Devolve null quando o CEP não tem 8 dígitos. */
export function normalizarCep(cep) {
  const digitos = String(cep ?? '').replace(/\D/g, '')
  return digitos.length === 8 ? digitos : null
}

function baseUrl() {
  const ambiente = process.env.ME_AMBIENTE === 'production' ? 'production' : 'sandbox'
  return URL_BASE[ambiente]
}

/** Chamada única à API: Bearer, headers obrigatórios, timeout e erro legível. */
async function chamarMelhorEnvio(caminho, corpo) {
  let resposta
  try {
    resposta = await fetch(`${baseUrl()}${caminho}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.ME_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        // Exigência da API: nome da aplicação + email de contato.
        'User-Agent': `Lume (${process.env.ME_CONTATO || 'suporte@lume.com.br'})`,
      },
      body: JSON.stringify(corpo),
      signal: AbortSignal.timeout(TIMEOUT_ME_MS),
    })
  } catch (err) {
    if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
      const timeout = new Error(`Melhor Envio: tempo esgotado após ${TIMEOUT_ME_MS} ms (${caminho})`)
      timeout.cause = err
      timeout.timeout = true
      throw timeout
    }
    throw err
  }

  if (!resposta.ok) {
    const texto = await resposta.text().catch(() => '')
    const erro = new Error(`Melhor Envio: ${resposta.status} ${texto}`.trim())
    erro.status = resposta.status
    erro.api = true // erro da plataforma (não do nosso validador)
    throw erro
  }
  return resposta.json()
}

/**
 * Monta o products[] da cotação a partir dos produtos do banco.
 * Dimensões ausentes usam um fallback documentado (peças da loja são
 * pequenas) — sem isso a API recusa com 422 e ninguém consegue cotar.
 * insurance_value é o preço unitário (a API multiplica pela quantidade).
 */
export function montarProdutosCotacao(itens, porId) {
  const FALLBACK = { peso: 0.3, altura: 5, largura: 20, comprimento: 20 }
  const agregados = new Map()

  for (const item of itens) {
    const produto = porId.get(Number(item.produtoId))
    if (!produto) continue
    const registro = agregados.get(produto.id) || { produto, quantidade: 0 }
    registro.quantidade += Number(item.quantidade) || 0
    agregados.set(produto.id, registro)
  }

  const products = []
  for (const { produto, quantidade } of agregados.values()) {
    if (quantidade <= 0) continue
    if (produto.peso == null || produto.altura == null) {
      logger.warn(
        { produtoId: produto.id, nome: produto.nome },
        'Produto sem peso/dimensões — usando fallback na cotação de frete'
      )
    }
    products.push({
      id: String(produto.id),
      width: Number(produto.largura) || FALLBACK.largura,
      height: Number(produto.altura) || FALLBACK.altura,
      length: Number(produto.comprimento) || FALLBACK.comprimento,
      weight: Number(produto.peso) || FALLBACK.peso,
      insurance_value: Number(produto.preco) || 0,
      quantity: quantidade,
    })
  }
  return products
}

/**
 * Encomenda padrão para a simulação pública da home (sem carrinho).
 * Serve para dar uma ideia do preço de entrega antes da pessoa escolher as
 * peças — o checkout sempre cotará com os produtos reais. Dimensões iguais
 * ao fallback de montarProdutosCotacao e valor declarado 0 (sem seguro).
 */
export function pacotePadrao() {
  return {
    id: '1',
    width: 20,
    height: 15,
    length: 20,
    weight: 0.3,
    insurance_value: 0,
    quantity: 1,
  }
}

/** Normaliza a resposta da API para o formato usado pelo frontend. */
function normalizarOpcoes(resposta) {
  const lista = Array.isArray(resposta) ? resposta : []
  return lista
    .map((opcao) => ({
      servicoId: Number(opcao.id),
      servico: opcao.name || `Serviço ${opcao.id}`,
      valor: Number(opcao.price),
      prazoMin: Number(opcao.delivery_range?.min ?? opcao.delivery_time ?? 0),
      prazoMax: Number(opcao.delivery_range?.max ?? opcao.delivery_time ?? 0),
      transportadora: opcao.company?.name || '',
      logo: opcao.company?.picture || '',
      desconto: Number(opcao.discount) || 0,
    }))
    .filter((opcao) => Number.isInteger(opcao.servicoId) && Number.isFinite(opcao.valor))
    .sort((a, b) => a.valor - b.valor)
}

/**
 * Cota o frete de um carrinho para o CEP informado.
 *
 * @param {string} cepDestino - CEP do cliente já normalizado (8 dígitos)
 * @param {Array}  products   - saída de montarProdutosCotacao()
 * @returns {Promise<Array>} opções normalizadas, da mais barata para a mais cara
 */
export async function calcularFrete(cepDestino, products) {
  const corpo = {
    from: { postal_code: normalizarCep(process.env.ME_CEP_ORIGEM) },
    to: { postal_code: cepDestino },
    products,
    options: { receipt: false, own_hand: false },
  }
  const servicos = process.env.ME_SERVICOS?.trim()
  if (servicos) corpo.services = servicos

  const resposta = await chamarMelhorEnvio('/api/v2/me/shipment/calculate', corpo)
  const opcoes = normalizarOpcoes(resposta)
  logger.info(
    { cepDestino, servicos: opcoes.length, ambiente: process.env.ME_AMBIENTE || 'sandbox' },
    'Cotação de frete realizada'
  )
  return opcoes
}

/**
 * Revalida uma opção escolhida no frontend e devolve o frete confiável.
 * O valor que entra no total do pedido é SEMPRE o desta resposta — o que
 * veio do browser é descartado (regra anti-fraude do plano).
 *
 * @returns {Promise<{servicoId, servico, valor, prazoMin, prazoMax, transportadora, cep}>}
 * @throws {Error} com .status 400 quando a opção não existe mais
 */
export async function revalidarFrete({ servicoId, cep, products }) {
  const opcoes = await calcularFrete(cep, products)
  const escolhida = opcoes.find((opcao) => opcao.servicoId === Number(servicoId))
  if (!escolhida) {
    const erro = new Error('Opção de frete não disponível para este endereço. Recalcule o frete.')
    erro.status = 400
    throw erro
  }
  return { ...escolhida, cep }
}

/**
 * Traduz o erro da API para status + mensagem do site. Compartilhado por
 * POST /api/frete/calcular e pelo checkout — as duas telas devem responder
 * igual para o mesmo problema (timeout, CEP fora de área, token inválido).
 */
export function erroParaResposta(err) {
  if (err.timeout) {
    return { status: 504, erro: 'O serviço de frete demorou para responder. Tente novamente.' }
  }
  // Erro do NOSO validador (ex.: opção escolhida sumiu): repassa a mensagem.
  if (err.status === 400 && !err.api) {
    return { status: 400, erro: err.message || 'Opção de frete inválida. Recalcule o frete.' }
  }
  // A API recusou a cotação: 400/422 = CEP fora de área ou payload inválido.
  if (err.status === 400 || err.status === 422) {
    return { status: 400, erro: 'CEP fora da área de cobertura ou dados de cotação inválidos.' }
  }
  return { status: 502, erro: 'Não foi possível calcular o frete agora. Tente novamente.' }
}
