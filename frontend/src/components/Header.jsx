import { useState, useRef, useEffect, useMemo } from 'react'
import { generos } from '../data/produtos'

function Header({ generoId, onSelecionarGenero, onHome, onAssinar, onMostrarPerfil, totalCarrinho = 0, onMostrarCarrinho, totalFavoritos = 0, onMostrarFavoritos }) {
  const [menuAberto, setMenuAberto] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const [busca, setBusca] = useState('')
  const buscaRef = useRef(null)

  const sugestoes = useMemo(() => {
    const alvo = busca
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
    if (!alvo) return []
    const normalizar = (s) =>
      s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return generos.filter(
      (g) => normalizar(g.nome).includes(alvo) || g.id.includes(alvo)
    )
  }, [busca])

  useEffect(() => {
    if (!buscando) return
    function fechar(e) {
      if (buscaRef.current && !buscaRef.current.contains(e.target)) setBuscando(false)
    }
    document.addEventListener('mousedown', fechar)
    return () => document.removeEventListener('mousedown', fechar)
  }, [buscando])

  function confirmarBusca(genero) {
    if (!genero) return
    setBuscando(false)
    setBusca('')
    navegar(() => onSelecionarGenero(genero.id))
  }

  function navegar(acao) {
    setMenuAberto(false)
    acao()
  }

  return (
    <header
      className="h-[64px] md:h-[90px] border-b fixed top-0 left-0 right-0 z-40"
      style={{
        background: 'var(--cor-fundo-cartao)',
        borderColor: 'var(--cor-borda)',
      }}
    >
      <div className="max-w-[1400px] h-full mx-auto flex items-center justify-between px-4 md:px-6">
        <button
          onClick={onHome}
          className="border-none bg-transparent cursor-pointer flex items-center shrink-0"
          aria-label="Locus — início"
        >
          <span
            className="flex items-center leading-none"
            style={{ fontFamily: 'Cinzel, Georgia, serif', color: 'var(--cor-texto)' }}
          >
            <span className="font-bold" style={{ fontSize: 'clamp(28px, 5vw, 44px)' }}>L</span>
            <img
              src={`${import.meta.env.BASE_URL}logo.jpeg`}
              alt=""
              className="h-9 w-9 md:h-11 md:w-11 rounded-full object-cover mx-0.5"
            />
            <span className="font-bold" style={{ fontSize: 'clamp(28px, 5vw, 44px)' }}>cus</span>
          </span>
        </button>

        <nav className="hidden lg:block">
          <ul className="flex gap-[30px] list-none items-center">
            {generos.map((genero) => (
              <li key={genero.id}>
                <button
                  onClick={() => onSelecionarGenero(genero.id)}
                  className={`bg-transparent border-none cursor-pointer text-base transition-colors ${
                    generoId === genero.id ? 'font-semibold' : ''
                  }`}
                  style={{
                    color: generoId === genero.id ? 'var(--cor-primaria)' : 'var(--cor-texto)',
                  }}
                >
                  {genero.nome}
                </button>
              </li>
            ))}
            <li>
              <button
                onClick={onAssinar}
                className="px-4 py-2 rounded-full text-sm font-medium text-white cursor-pointer transition-transform duration-200 hover:scale-105 border-none"
                style={{ background: 'var(--cor-primaria)' }}
              >
                Clube Locus
              </button>
            </li>
          </ul>
        </nav>

        <div className="flex gap-3 md:gap-4 items-center">
<button
            className="bg-transparent border-none p-0 cursor-pointer"
            onClick={() => setBuscando(true)}
            aria-label="Buscar universos"
            aria-expanded={buscando}
          >
            <img
              className="header-icon-lupa w-7 h-7 md:w-8 md:h-8"
              src="https://cdn-icons-png.flaticon.com/256/64/64673.png"
              alt="Buscar"
            />
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
<img className="header-icon-perfil w-7 h-7 md:w-8 md:h-8" src="https://cdn-icons-png.flaticon.com/512/3106/3106921.png" alt="Perfil" />
          </button>
          <button
            className="relative bg-transparent border-none p-0 cursor-pointer"
            onClick={onMostrarCarrinho}
            aria-label="Carrinho"
          >
            <img
className="header-icon-carrinho w-7 h-7 md:w-8 md:h-8"
              src="https://cdn-icons-png.flaticon.com/512/4202/4202388.png"
              alt="Carrinho"
            />
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
            onClick={() => setMenuAberto((m) => !m)}
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
      </div>

      {buscando && (
        <div
          ref={buscaRef}
          className="absolute top-full left-0 right-0 border-b shadow-xl"
          style={{ background: 'var(--cor-fundo-cartao)', borderColor: 'var(--cor-borda)' }}
        >
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4">
            <div
              className="flex items-center gap-2 rounded-xl border px-3"
              style={{ borderColor: 'var(--cor-borda)', background: 'var(--cor-fundo-suave)' }}
            >
              <img className="header-icon-lupa w-5 h-5" src="https://cdn-icons-png.flaticon.com/256/64/64673.png" alt="" />
              <input
                autoFocus
                type="text"
                placeholder="Pesquise um universo (ex.: romance, fantasia, suspense)"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && sugestoes.length > 0) confirmarBusca(sugestoes[0])
                  if (e.key === 'Escape') setBuscando(false)
                }}
                className="flex-1 min-w-0 bg-transparent border-none outline-none py-2 text-sm"
                style={{ color: 'var(--cor-texto)' }}
              />
            </div>
            {busca.trim() && (
              <ul className="mt-2 list-none">
                {sugestoes.length > 0 ? (
                  sugestoes.map((genero) => (
                    <li key={genero.id}>
                      <button
                        onClick={() => confirmarBusca(genero)}
                        className="w-full text-left px-3 py-2.5 rounded-lg bg-transparent border-none cursor-pointer text-sm hover:opacity-70"
                        style={{ color: 'var(--cor-texto)' }}
                      >
                        {genero.nome}
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="px-3 py-2 text-sm" style={{ color: 'var(--cor-texto-suave)' }}>
                    Nenhum universo encontrado.
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>
      )}

      {menuAberto && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setMenuAberto(false)}
          />

          <div
            className="absolute left-0 top-0 h-full w-[82%] max-w-[340px] flex flex-col shadow-2xl animate-[slideInLeft_0.3s_ease-out]"
            style={{ background: 'var(--cor-fundo-cartao)' }}
          >
            <style>{`
              @keyframes slideInLeft {
                from { transform: translateX(-100%); }
                to { transform: translateX(0); }
              }
            `}</style>

            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: 'var(--cor-borda)' }}
            >
              <span
                className="flex items-center leading-none"
                style={{ fontFamily: 'Cinzel, Georgia, serif', color: 'var(--cor-texto)' }}
              >
                <span className="font-bold" style={{ fontSize: '32px' }}>L</span>
                <img src={`${import.meta.env.BASE_URL}logo.jpeg`} alt="" className="h-8 w-8 rounded-full object-cover mx-0.5" />
                <span className="font-bold" style={{ fontSize: '32px' }}>cus</span>
              </span>
              <button
                onClick={() => setMenuAberto(false)}
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
                    onClick={() => navegar(() => onSelecionarGenero(genero.id))}
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
              <li>
                <button
                  onClick={() => navegar(onAssinar)}
                  className="mt-3 w-full py-3.5 rounded-xl text-white text-base font-medium cursor-pointer border-none"
                  style={{ background: 'var(--cor-primaria)' }}
                >
                  Clube Locus
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header