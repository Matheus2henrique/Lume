export function formatarMoeda(valor) {
  return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`
}

export function formatarNota(media) {
  return Number(media || 0).toFixed(1).replace('.', ',')
}

export function formatarTotalAvaliacoes(total) {
  return Number(total) === 1 ? '1 avaliação' : `${Number(total) || 0} avaliações`
}

export function normalizarProduto(p) {
  return {
    id: p.id,
    nome: p.nome,
    genero: p.genero,
    tipo: p.tipo,
    preco: Number(p.preco),
    estoque: p.estoque,
    permiteUpload: p.permite_upload,
    descricao: p.descricao,
    imagem: p.imagem,
  }
}
