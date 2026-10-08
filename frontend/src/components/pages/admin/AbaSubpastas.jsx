// Aba "Subpastas": as pastas de cada nicho que aparecem no menu (nicho >
// subpasta) e viram filtro da página do nicho. Excluir/editar abre o
// formulário — a exclusão pede confirmação lá dentro.
function AbaSubpastas({ nichos, produtos, subcategorias, onNovo, onEditar }) {
  const total = nichos.reduce((soma, g) => soma + (subcategorias[g.id]?.length || 0), 0)

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--cor-texto)' }}>
            Subpastas do menu
          </h2>
          <p className="text-sm" style={{ color: 'var(--cor-texto-suave)' }}>
            {total} subpasta(s) em {nichos.length} nicho(s). Nicho sem subpasta leva direto à página dele.
          </p>
        </div>
        <button
          onClick={() => onNovo()}
          className="px-5 py-2 rounded-full border-none cursor-pointer text-sm font-medium transition-transform hover:scale-105"
          style={{ background: 'var(--cor-laranja)', color: '#fff' }}
        >
          + Nova subpasta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {nichos.map((nicho) => {
          const subs = subcategorias[nicho.id] || []
          return (
            <div
              key={nicho.id}
              className="rounded-2xl p-5"
              style={{ background: 'var(--cor-fundo-cartao)', border: '1px solid var(--cor-borda)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm" style={{ color: 'var(--cor-texto)' }}>
                  {nicho.nome}
                </h3>
                <button
                  onClick={() => onNovo(nicho.id)}
                  className="w-7 h-7 rounded-full flex items-center justify-center border-none cursor-pointer text-white text-lg leading-none"
                  style={{ background: 'var(--cor-laranja)' }}
                  title={`Criar subpasta em ${nicho.nome}`}
                >
                  +
                </button>
              </div>

              {subs.length === 0 ? (
                <p className="text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
                  Sem subpastas — o menu mostra só o nicho.
                </p>
              ) : (
                <ul className="flex flex-col gap-2 list-none m-0 p-0">
                  {subs.map((sub) => {
                    const qtd = produtos.filter((p) => p.genero === nicho.id && p.subcategoria === sub.id).length
                    return (
                      <li key={sub.id} className="flex items-center gap-2">
                        <button
                          onClick={() => onEditar(sub)}
                          className="flex-1 text-left px-3 py-2 rounded-lg border-none cursor-pointer text-sm transition-colors hover:bg-[rgba(255,255,255,0.06)]"
                          style={{ background: 'var(--cor-fundo)', color: 'var(--cor-texto)' }}
                          title="Editar subpasta"
                        >
                          <span className="mr-1.5">{sub.icone}</span>
                          {sub.nome}
                          <span className="ml-1.5 text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
                            ({qtd})
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AbaSubpastas
