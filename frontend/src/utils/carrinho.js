const CHAVE_CARRINHO = 'lume_carrinho'

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
