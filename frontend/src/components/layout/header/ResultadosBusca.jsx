import { formatarMoeda } from '../../../utils/formatar'

function ResultadosBusca({ busca, temResultado, produtosEncontrados, nichosEncontrados, nomeGenero, onEscolherProduto, onEscolherGenero }) {
  return (
    <div className="mt-3 max-h-[65vh] overflow-y-auto">
      {!temResultado && (
        <p className="px-3 py-2 text-sm" style={{ color: 'var(--cor-texto-suave)' }}>
          Nada encontrado para “{busca.trim()}”.
        </p>
      )}

      {produtosEncontrados.length > 0 && (
        <div>
          <p className="px-3 pb-1 text-[11px] uppercase tracking-widest" style={{ color: 'var(--cor-texto-suave)' }}>
            Produtos
          </p>
          <ul className="list-none flex flex-col gap-1">
            {produtosEncontrados.map((produto) => (
              <li key={`produto-${produto.id}`}>
                <button
                  onClick={() => onEscolherProduto(produto)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-transparent border-none cursor-pointer text-left hover:opacity-70"
                  style={{ color: 'var(--cor-texto)' }}
                >
                  <span
                    className="w-10 h-10 rounded-md overflow-hidden shrink-0"
                    style={{ background: 'var(--cor-fundo-suave)' }}
                  >
                    {produto.imagem ? (
                      <img src={produto.imagem} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span
                        className="w-full h-full flex items-center justify-center text-xs"
                        style={{ color: 'var(--cor-texto-suave)' }}
                      >
                        🎁
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{produto.nome}</span>
                    <span className="block truncate text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
                      {nomeGenero(produto.genero) || 'Sem universo'}
                    </span>
                  </span>
                  <span className="text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--cor-laranja-claro)' }}>
                    {formatarMoeda(produto.preco)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {nichosEncontrados.length > 0 && (
        <div className={produtosEncontrados.length > 0 ? 'mt-3' : ''}>
          <p className="px-3 pb-1 text-[11px] uppercase tracking-widest" style={{ color: 'var(--cor-texto-suave)' }}>
            Universos
          </p>
          <ul className="list-none flex flex-col gap-1">
            {nichosEncontrados.map((genero) => (
              <li key={genero.id}>
                <button
                  onClick={() => onEscolherGenero(genero)}
                  className="w-full text-left px-3 py-2.5 rounded-lg bg-transparent border-none cursor-pointer text-sm hover:opacity-70"
                  style={{ color: 'var(--cor-texto)' }}
                >
                  <span className="block truncate">{genero.nome}</span>
                  {genero.tagline && (
                    <span className="block truncate text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
                      {genero.tagline}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default ResultadosBusca
