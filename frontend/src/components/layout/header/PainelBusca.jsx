import ResultadosBusca from './ResultadosBusca'

function PainelBusca({ containerRef, busca, onMudarBusca, onEnter, onEsc, temResultado, produtosEncontrados, nichosEncontrados, nomeGenero, onEscolherProduto, onEscolherGenero }) {
  return (
    <div
      ref={containerRef}
      className="absolute top-full left-0 right-0 border-b shadow-xl"
      style={{ background: 'var(--cor-fundo-cartao)', borderColor: 'var(--cor-borda)' }}
    >
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4">
        <div
          className="flex items-center gap-2 rounded-xl border px-3"
          style={{ borderColor: 'var(--cor-borda)', background: 'var(--cor-fundo-suave)' }}
        >
          <svg className="header-icon-lupa w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="var(--cor-texto)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            autoFocus
            type="text"
            placeholder="Pesquise universos e produtos (ex.: Dinossauros, suporte de livros)"
            value={busca}
            onChange={(e) => onMudarBusca(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onEnter()
              if (e.key === 'Escape') onEsc()
            }}
            className="flex-1 min-w-0 bg-transparent border-none outline-none py-2 text-sm"
            style={{ color: 'var(--cor-texto)' }}
          />
        </div>
        {busca.trim() && (
          <ResultadosBusca
            busca={busca}
            temResultado={temResultado}
            produtosEncontrados={produtosEncontrados}
            nichosEncontrados={nichosEncontrados}
            nomeGenero={nomeGenero}
            onEscolherProduto={onEscolherProduto}
            onEscolherGenero={onEscolherGenero}
          />
        )}
      </div>
    </div>
  )
}

export default PainelBusca
