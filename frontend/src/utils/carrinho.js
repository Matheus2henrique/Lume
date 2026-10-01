const CHAVE_CARRINHO = 'lume_carrinho'

/**
 * Guarda só o que interessa das opções (cor/tamanho) e descarta o resto.
 * Sem opção nenhuma o item vira null — itens antigos continuam válidos.
 */
export function normalizarOpcoes(opcoes) {
  if (!opcoes || typeof opcoes !== 'object') return null
  const cor = typeof opcoes.cor === 'string' ? opcoes.cor.trim().slice(0, 40) : ''
  const tamanho = typeof opcoes.tamanho === 'string' ? opcoes.tamanho.trim().slice(0, 40) : ''
  if (!cor && !tamanho) return null
  return { cor, tamanho }
}

/**
 * Identidade de uma linha do carrinho: produto + variação. O mesmo produto em
 * tamanhos/cor diferentes são linhas diferentes (não somam quantidade).
 */
export function chaveItem(item) {
  const id = item?.produto?.id ?? ''
  const opcoes = normalizarOpcoes(item?.opcoes)
  return `${id}|${opcoes?.cor ?? ''}|${opcoes?.tamanho ?? ''}`
}

/**
 * Lê o carrinho salvo no navegador.
 * A imagem do produto não é persistida (é o campo maior e poderia estourar a
 * cota do localStorage) — ela volta pelo catálogo na reconciliação do App.
 */
export function carregarCarrinho() {
  try {
    const bruto = JSON.parse(localStorage.getItem(CHAVE_CARRINHO))
    if (!Array.isArray(bruto)) return []
    return bruto
      .filter(
        (item) =>
          item &&
          item.produto &&
          Number.isInteger(item.produto.id) &&
          Number.isInteger(item.quantidade) &&
          item.quantidade > 0
      )
      .map((item) => ({
        produto: item.produto,
        quantidade: item.quantidade,
        personalizacao: item.personalizacao ?? null,
        opcoes: normalizarOpcoes(item.opcoes),
      }))
  } catch {
    // JSON corrompido ou armazenamento indisponível: começa vazio.
    return []
  }
}

export function salvarCarrinho(itens) {
  try {
    const paraSalvar = (Array.isArray(itens) ? itens : []).map((item) => ({
      ...item,
      produto: { ...item.produto, imagem: '' },
    }))
    localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(paraSalvar))
  } catch {
    // Cota cheia ou modo privado: o carrinho segue apenas em memória.
  }
}
