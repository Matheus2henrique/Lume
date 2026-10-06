import { useState } from 'react'
import { subcategorias } from '../../../data/subcategorias'

// Menu mobile em acordeão de 2 níveis: nicho > subpasta.
// Clicar na subpasta leva direto para a página do nicho já com o filtro dela
// (?sub=...); nicho sem subpasta — Coleção Dinossauro e Pacotes — o clique já
// vai direto para a página do nicho.
function MenuMobile({ generos, generoId, onEscolherGenero, onFechar }) {
  const [nichoAberto, setNichoAberto] = useState(null)

  function alternarNicho(id) {
    setNichoAberto((atual) => (atual === id ? null : id))
  }

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
          {generos.map((genero) => {
            const aberto = nichoAberto === genero.id
            const subs = subcategorias[genero.id] || []
            const ehAtual = generoId === genero.id

            return (
              <li key={genero.id}>
                <button
                  onClick={() => (subs.length > 0 ? alternarNicho(genero.id) : onEscolherGenero(genero.id))}
                  aria-expanded={subs.length > 0 ? aberto : undefined}
                  className={`w-full text-left py-3.5 px-3 rounded-xl bg-transparent border-none cursor-pointer text-base transition-colors ${
                    ehAtual || aberto ? 'font-semibold' : ''
                  }`}
                  style={{
                    color: ehAtual || aberto ? 'var(--cor-primaria)' : 'var(--cor-texto)',
                    background: ehAtual ? 'var(--cor-primaria-suave)' : 'transparent',
                  }}
                >
                  {genero.nome}
                </button>

                {aberto && subs.length > 0 && (
                  <ul className="list-none m-0 p-0 mt-0.5 flex flex-col">
                    {subs.map((sub) => (
                      <li key={`sub-${sub.id}`}>
                        <button
                          onClick={() => onEscolherGenero(genero.id, sub.id)}
                          className="w-full text-left py-2.5 pl-8 pr-3 rounded-lg bg-transparent border-none cursor-pointer text-sm transition-colors"
                          style={{ color: 'var(--cor-texto)' }}
                        >
                          {sub.nome}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

export default MenuMobile
