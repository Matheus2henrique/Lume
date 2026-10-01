function NichosSidebar({ nichos, produtos, filtroNichos, onFiltrar, onNovo, onEditar, onExcluir }) {
  return (
    <div className="lg:w-72 shrink-0">
      <div
        className="rounded-2xl p-5 mb-6"
        style={{ background: 'var(--cor-fundo-cartao)', border: '1px solid var(--cor-borda)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--cor-texto)' }}>
            Nichos
          </h2>
          <button
            onClick={onNovo}
            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer border-none text-white text-xl font-bold transition-transform hover:scale-110"
            style={{ background: 'var(--cor-laranja)' }}
            title="Criar novo nicho"
          >
            +
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => onFiltrar('todos')}
            className="text-left px-3 py-2 rounded-lg border-none cursor-pointer text-sm transition-colors"
            style={{
              background: filtroNichos === 'todos' ? 'var(--cor-laranja)' : 'transparent',
              color: filtroNichos === 'todos' ? '#fff' : 'var(--cor-texto-suave)',
            }}
          >
            Todos ({nichos.length})
          </button>
          <div
            className="text-left px-3 py-2 rounded-lg text-sm"
            style={{ color: 'var(--cor-texto-suave)' }}
          >
            Produtos ({produtos.length})
          </div>
          {nichos.map((n) => {
            const count = produtos.filter((p) => p.genero === n.id).length
            return (
              <div key={n.id} className="flex items-center gap-1">
                <button
                  onClick={() => onFiltrar(n.id)}
                  className="flex-1 text-left px-3 py-2 rounded-lg border-none cursor-pointer text-sm transition-colors"
                  style={{
                    background: filtroNichos === n.id ? 'var(--cor-laranja)' : 'transparent',
                    color: filtroNichos === n.id ? '#fff' : 'var(--cor-texto-suave)',
                  }}
                >
                  {n.nome} ({count})
                </button>
                <button
                  onClick={() => onEditar(n)}
                  className="w-7 h-7 rounded flex items-center justify-center border-none cursor-pointer bg-transparent transition-colors hover:bg-[rgba(255,255,255,0.1)]"
                  style={{ color: 'var(--cor-texto-suave)' }}
                  title="Editar nicho"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  onClick={() => onExcluir(n.id)}
                  className="w-7 h-7 rounded flex items-center justify-center border-none cursor-pointer bg-transparent transition-colors hover:bg-[rgba(239,68,68,0.2)]"
                  style={{ color: 'var(--cor-perigo)' }}
                  title="Excluir nicho"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default NichosSidebar
