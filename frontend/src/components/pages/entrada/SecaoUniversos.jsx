// Colunas do grid no desktop (lg): equilibra as fileiras com máx. 5 por fila.
// 5→5 | 6→3 (3+3) | 7→4 (4+3) | 8→4 (4+4) | 11→4 (4+4+3) | 12→4 (4+4+4)
function colunasDesktop(total) {
  if (total <= 5) return Math.max(total, 1)
  const fileiras = Math.ceil(total / 5)
  return Math.ceil(total / fileiras)
}

function SecaoUniversos({ nichos, admin, onSelecionarGenero, onNovoNicho, onEditarNicho }) {
  return (
    <>
      <h2 className="text-center text-4xl font-[Georgia,serif]" style={{ color: 'var(--cor-laranja-claro)' }}>
        Escolha o seu universo
      </h2>
      <p className="mt-4 text-center" style={{ color: 'var(--cor-texto-suave)' }}>
        Toque em um gênero e entre em uma página com a cara dele.
      </p>
      {admin && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={onNovoNicho}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full border-none cursor-pointer text-sm font-medium transition-transform hover:scale-105"
            style={{ background: 'var(--cor-laranja)', color: 'var(--cor-texto)' }}
          >
            <span className="text-lg leading-none">+</span> Novo nicho
          </button>
        </div>
      )}

      <div
        className="mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[repeat(var(--cols),minmax(0,1fr))] gap-8"
        style={{ ['--cols']: String(colunasDesktop(nichos.length)) }}
      >
        {nichos.map((genero) => (
          <button
            key={genero.id}
            onClick={() => onSelecionarGenero(genero.id)}
            className="group relative h-[340px] overflow-hidden rounded-[24px] cursor-pointer border-none text-left shadow-[0_10px_30px_rgba(0,0,0,0.15)]"
          >
            {admin && (
              <span
                onClick={(e) => { e.stopPropagation(); onEditarNicho(genero) }}
                className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
                style={{ background: 'rgba(0,0,0,0.6)', color: 'var(--cor-texto)' }}
                title="Editar nicho"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </span>
            )}
            <img
              src={genero.imagem}
              alt={genero.nome}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-135"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-7">
              <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm text-white mb-3">
                {genero.tagline}
              </span>
              <h3 className="text-3xl font-[Georgia,serif] text-white">{genero.nome}</h3>
              <p className="mt-2 text-white/80 text-sm leading-relaxed line-clamp-2">{genero.descricao}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-white font-semibold">
                Entrar no universo
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-16 flex flex-wrap justify-center gap-6 sm:gap-10">
        {nichos.map((genero) => (
          <button
            key={genero.id}
            onClick={() => onSelecionarGenero(genero.id)}
            className="group flex flex-col items-center cursor-pointer border-none bg-transparent"
          >
            <span className="relative w-24 h-24 sm:w-34 sm:h-34 md:w-[11.4rem] md:h-[11.4rem] rounded-full overflow-hidden transition-all duration-700 group-hover:scale-110 group-hover:-translate-y-1 shadow-[0_10px_30px_rgba(0,0,0,0.18)] group-hover:shadow-[0_18px_45px_rgba(0,0,0,0.28)]">
              <img
                src={genero.imagem}
                alt={genero.nome}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-125"
              />
              <span
                className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ background: 'color-mix(in srgb, var(--cor-primaria) 35%, transparent)' }}
              />
            </span>
            <span
              className="mt-3 text-base font-semibold transition-colors duration-300"
              style={{ color: 'var(--cor-texto)' }}
            >
              {genero.nome}
            </span>
          </button>
        ))}
      </div>
    </>
  )
}

export default SecaoUniversos
