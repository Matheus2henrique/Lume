function MegaMenuNicho({ genero, produtos, onAbrirNicho, onAdiarFechamento, onEscolherProduto }) {
  if (!genero) return null

  const produtosDoNicho = produtos.filter((p) => p.genero === genero.id).slice(0, 8)

  return (
    <div
      onMouseEnter={() => onAbrirNicho(genero.id)}
      onMouseLeave={onAdiarFechamento}
      className="mega-menu absolute top-full left-0 mt-3 w-max max-w-[320px] rounded-xl border shadow-xl py-2 z-50"
      style={{ background: 'var(--cor-fundo-cartao)', borderColor: 'var(--cor-borda)' }}
    >
      {produtosDoNicho.length > 0 ? (
        <ul className="list-none m-0 p-0 flex flex-col">
          {produtosDoNicho.map((produto, i) => (
            <li key={`nicho-produto-${produto.id}`}>
              <button
                onClick={() => onEscolherProduto(produto)}
                className="menu-item w-full text-left px-4 py-2 text-sm truncate bg-transparent border-none cursor-pointer"
                style={{ animationDelay: `${i * 45}ms` }}
              >
                {produto.nome}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-4 py-2 m-0 text-sm" style={{ color: 'var(--cor-texto-suave)' }}>
          Nenhum produto neste universo ainda.
        </p>
      )}
    </div>
  )
}

export default MegaMenuNicho
