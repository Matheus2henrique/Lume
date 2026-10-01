import { formatarMoeda } from '../../../utils/formatar'

function ListaProdutos({ produtosFiltrados, nichos, onNovoProduto, onEditarProduto, onExcluirProduto }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--cor-texto)' }}>
          Produtos ({produtosFiltrados.length})
        </h2>
        <button
          onClick={onNovoProduto}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full border-none cursor-pointer text-white text-sm font-medium transition-transform hover:scale-105"
          style={{ background: 'var(--cor-laranja)' }}
        >
          <span className="text-lg leading-none">+</span> Novo Produto
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {produtosFiltrados.map((produto) => {
          const nicho = nichos.find((n) => n.id === produto.genero)
          return (
            <div
              key={produto.id}
              className="rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
              style={{ background: 'var(--cor-fundo-cartao)', border: '1px solid var(--cor-borda)' }}
            >
              <div className="relative">
                <img
                  src={produto.imagem}
                  alt={produto.nome}
                  className="w-full h-[160px] object-cover"
                />
                {nicho && (
                  <span
                    className="absolute top-2 left-2 text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: 'var(--cor-badge-primaria)', color: '#fff' }}
                  >
                    {nicho.nome}
                  </span>
                )}
              </div>
              <div className="p-3">
                <h3 className="text-sm font-semibold mb-2 leading-snug" style={{ color: 'var(--cor-texto)' }}>
                  {produto.nome}
                </h3>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-base font-bold" style={{ color: 'var(--cor-laranja-claro)' }}>
                    {formatarMoeda(produto.preco)}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
                    {produto.estoque} em estoque
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onEditarProduto(produto)}
                    className="flex-1 py-2 rounded-lg border-none cursor-pointer text-xs font-medium text-white transition-opacity hover:opacity-80"
                    style={{ background: 'var(--cor-laranja)' }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onExcluirProduto(produto.id)}
                    className="py-2 px-3 rounded-lg border-none cursor-pointer text-xs font-medium transition-opacity hover:opacity-80"
                    style={{ background: 'var(--cor-perigo)', color: '#fff' }}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {produtosFiltrados.length === 0 && (
        <div className="text-center py-16">
          <p className="text-lg" style={{ color: 'var(--cor-texto-suave)' }}>
            Nenhum produto encontrado neste nicho.
          </p>
        </div>
      )}
    </div>
  )
}

export default ListaProdutos
