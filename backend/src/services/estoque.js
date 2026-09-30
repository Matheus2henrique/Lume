/**
 * Reserva de estoque (PLANO 1.6).
 *
 * Regra da loja: a peça sai do estoque na CRIAÇÃO do pedido e só volta se o
 * pedido for cancelado/webhook recusado/expirar. Assim ninguém consegue
 * comprar mais do que existe — o estoque é a soma do que está disponível.
 *
 * Três passos, sempre nessa ordem:
 *   1. travarProdutos  — SELECT ... FOR UPDATE (serializa checkouts paralelos);
 *   2. conferir        — valida na memória (não consulta o banco de novo);
 *   3. aplicar         — UPDATE que soma (+) ou subtrai (-).
 */

/** Soma as quantidades por produto (o mesmo produto pode aparecer 2x no carrinho). */
export function somarPorProduto(itens) {
  const mapa = new Map()
  for (const item of itens ?? []) {
    if (!item?.produtoId) continue
    const quantidade = Number(item.quantidade || 0)
    if (quantidade <= 0) continue
    mapa.set(item.produtoId, (mapa.get(item.produtoId) || 0) + quantidade)
  }
  return mapa
}

/** Trava as linhas dos produtos em ordem (evita deadlock entre checkouts). */
export async function travarProdutos(client, mapa) {
  const ids = [...mapa.keys()].sort((a, b) => a - b)
  if (ids.length === 0) return new Map()
  const { rows } = await client.query(
    'SELECT id, nome, estoque FROM produtos WHERE id = ANY($1) ORDER BY id FOR UPDATE',
    [ids]
  )
  return new Map(rows.map((p) => [p.id, p]))
}

/** Conferência em memória: devolve quem não cabe no estoque travado. */
export function conferir(produtos, mapa) {
  const faltando = []
  for (const [produtoId, quantidade] of mapa) {
    const produto = produtos.get(produtoId)
    if (!produto || produto.estoque < quantidade) {
      faltando.push({
        produtoId,
        nome: produto?.nome ?? `produto ${produtoId}`,
        disponivel: produto?.estoque ?? 0,
        pedido: quantidade,
      })
    }
  }
  return faltando
}

/** soma/retira as peças. Requer produtos já travados com travarProdutos. */
export async function aplicar(client, mapa, soma) {
  const ids = [...mapa.keys()].sort((a, b) => a - b)
  if (ids.length === 0) return
  await client.query(
    `UPDATE produtos SET estoque = estoque ${soma ? '+' : '-'} v.qtd
     FROM (SELECT UNNEST($1::int[]) AS id, UNNEST($2::int[]) AS qtd) AS v
     WHERE produtos.id = v.id`,
    [ids, ids.map((produtoId) => mapa.get(produtoId))]
  )
}

/**
 * Devolve as peças de um pedido cancelado.
 * Trava antes de somar para não brigar com um checkout que está baixando.
 */
export async function devolverEstoque(client, itens) {
  const mapa = somarPorProduto(itens)
  if (mapa.size === 0) return false
  await travarProdutos(client, mapa)
  await aplicar(client, mapa, true)
  return true
}
