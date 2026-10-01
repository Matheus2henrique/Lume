function BarraAcoes({ buscando, onAbrirBusca, totalFavoritos, onMostrarFavoritos, onMostrarPerfil, totalCarrinho, onMostrarCarrinho, menuAberto, onAlternarMenu }) {
  return (
    <div className="flex gap-3 md:gap-4 items-center">
<button
        className="bg-transparent border-none p-0 cursor-pointer"
        onClick={onAbrirBusca}
        aria-label="Buscar"
        aria-expanded={buscando}
      >
        <svg viewBox="0 0 24 24" className="header-icon-lupa w-7 h-7 md:w-8 md:h-8" fill="none" stroke="var(--cor-texto)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>

      <button
        className="relative bg-transparent border-none p-0 cursor-pointer"
        onClick={onMostrarFavoritos}
        aria-label="Meus favoritos"
      >
        <svg viewBox="0 0 24 24" className="header-icon-heart w-7 h-7 md:w-8 md:h-8" aria-hidden="true">
          {totalFavoritos > 0 ? (
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              fill="#ef4444"
            />
          ) : (
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              fill="none"
              stroke="var(--cor-texto)"
              strokeWidth="2"
            />
          )}
        </svg>
        {totalFavoritos > 0 && (
          <span
            className="absolute -top-2 -right-2 min-w-[20px] h-[20px] px-1 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
            style={{ background: 'var(--cor-primaria)' }}
          >
            {totalFavoritos}
          </span>
        )}
      </button>

      <button
        className="bg-transparent border-none p-0 cursor-pointer"
        onClick={onMostrarPerfil}
        aria-label="Perfil"
      >
        <svg viewBox="0 0 24 24" className="header-icon-perfil w-7 h-7 md:w-8 md:h-8" fill="none" stroke="var(--cor-texto)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </button>
      <button
        className="relative bg-transparent border-none p-0 cursor-pointer"
        onClick={onMostrarCarrinho}
        aria-label="Carrinho"
      >
        <svg viewBox="0 0 24 24" className="header-icon-carrinho w-7 h-7 md:w-8 md:h-8" fill="none" stroke="var(--cor-texto)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          <circle cx="9" cy="21" r="1" fill="var(--cor-texto)" />
          <circle cx="20" cy="21" r="1" fill="var(--cor-texto)" />
        </svg>
        {totalCarrinho > 0 && (
          <span
            className="absolute -top-2 -right-2 min-w-[20px] h-[20px] px-1 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
            style={{ background: 'var(--cor-primaria)' }}
          >
            {totalCarrinho}
          </span>
        )}
      </button>

      <button
        className="lg:hidden w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer border-none"
        style={{ background: 'var(--cor-fundo-suave)', color: 'var(--cor-texto)' }}
        onClick={onAlternarMenu}
        aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
        aria-expanded={menuAberto}
      >
        {menuAberto ? (
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" aria-hidden="true">
            <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" aria-hidden="true">
            <path d="M3 6h18v2H3zM3 11h18v2H3zM3 16h18v2H3z" />
          </svg>
        )}
      </button>
    </div>
  )
}

export default BarraAcoes
