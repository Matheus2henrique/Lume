export function formatarMoeda(valor) {
  return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`
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
