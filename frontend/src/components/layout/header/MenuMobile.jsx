function MenuMobile({ generos, generoId, onEscolherGenero, onFechar }) {
  return (
    <div
      className="fixed inset-0 z-50 lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onFechar}
      />

      <div
        className="absolute left-0 top-0 h-full w-[82%] max-w-[340px] flex flex-col shadow-2xl animate-[slideInLeft_0.3s_ease-out]"
        style={{ background: 'var(--cor-fundo-cartao)' }}
      >

        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--cor-borda)' }}
        >
          <span
            className="flex items-center leading-none"
            style={{ fontFamily: 'Cinzel, Georgia, serif', color: 'var(--cor-texto)' }}
          >
            <span className="font-bold" style={{ fontSize: '32px' }}>Lume</span>
            <img src={`${import.meta.env.BASE_URL}logo.jpeg`} alt="" className="h-8 w-8 rounded-full object-cover mx-0.5" />
          </span>
          <button
            onClick={onFechar}
            className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer border-none"
            style={{ background: 'var(--cor-fundo-suave)', color: 'var(--cor-texto)' }}
            aria-label="Fechar menu"
          >
            ✕
          </button>
        </div>

        <ul className="flex-1 overflow-y-auto px-4 py-4 list-none flex flex-col gap-1">
          {generos.map((genero) => (
            <li key={genero.id}>
              <button
                onClick={() => onEscolherGenero(genero.id)}
                className={`w-full text-left py-3.5 px-3 rounded-xl bg-transparent border-none cursor-pointer text-base transition-colors ${
                  generoId === genero.id ? 'font-semibold' : ''
                }`}
                style={{
                  color: generoId === genero.id ? 'var(--cor-primaria)' : 'var(--cor-texto)',
                  background: generoId === genero.id ? 'var(--cor-primaria-suave)' : 'transparent',
                }}
              >
                {genero.nome}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default MenuMobile
