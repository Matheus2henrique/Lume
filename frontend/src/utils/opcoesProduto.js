// Opções de variação do produto (página de detalhe → carrinho → pedido).

export const TAMANHOS = ['PP', 'P', 'M', 'G', 'GG', 'XG']

export const CORES = [
  { nome: 'Preto', hex: '#101010' },
  { nome: 'Branco', hex: '#ffffff' },
  { nome: 'Cinza', hex: '#9ca3af' },
  { nome: 'Laranja', hex: '#e8a93b' },
  { nome: 'Vermelho', hex: '#b3261e' },
  { nome: 'Azul marinho', hex: '#1f3a5f' },
]

/** Nome da cor → hex, para desenhar a bolinha em qualquer tela. */
export function hexDaCor(nome) {
  return CORES.find((c) => c.nome === nome)?.hex ?? 'transparent'
}

/** { tamanho: 'M', cor: 'Preto' } → "Tam. M · Cor Preto" */
export function textoOpcoes(opcoes) {
  const partes = []
  if (opcoes?.tamanho) partes.push(`Tam. ${opcoes.tamanho}`)
  if (opcoes?.cor) partes.push(`Cor ${opcoes.cor}`)
  return partes.join(' · ')
}
