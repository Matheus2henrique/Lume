import { useState } from 'react'
import Card from '../ui/Card'
import Reveal from '../ui/Reveal'
import { generos, produtos } from '../../data/produtos'

function Entrada({ onSelecionarGenero, onSelecionarProduto, favoritos, onToggleFavorito }) {
  const [lampadaLigada, setLampadaLigada] = useState(false)
  const destaque = [1, 11, 15, 9]
    .map((id) => produtos.find((p) => p.id === id))
    .filter(Boolean)

  return (
    <section>
      <div className="min-h-[380px] md:min-h-[420px] flex items-center justify-between px-5 md:px-6 lg:pl-[calc((100vw-1200px)/2+1.5rem)] lg:pr-[calc((100vw-1200px)/2+1.5rem)]"
        style={{ background: 'var(--fundo-decorativo)' }}
      >
        <div>
          <span
            className="tracking-[8px] text-xs md:text-sm text-left"
            style={{ color: 'var(--cor-laranja-claro)', animation: 'aparecer 0.7s ease-out 0.12s both' }}
          >
            PARA QUEM VIVE DENTRO DOS LIVROS
          </span>
          <h1
            className="text-4xl sm:text-5xl md:text-6xl leading-[0.95] my-5 font-[Georgia,serif] text-left"
            style={{ color: 'var(--cor-texto)', animation: 'aparecer 0.7s ease-out 0.28s both' }}
          >
            <span style={{ color: 'var(--cor-laranja-claro)' }}>Lume</span> — onde suas
            <br />
            histórias ganham forma
          </h1>
          <p
            className="text-lg sm:text-xl max-w-[560px] text-left"
            style={{ color: 'var(--cor-texto-suave)', animation: 'aparecer 0.7s ease-out 0.44s both' }}
          >
            Decorações e colecionáveis para os leitores que querem
            levar o seu gênero favorito para todos os cantos.
          </p>
        </div>
        <div className="hidden lg:block flex-shrink-0 -mr-[-110px]" style={{ animation: 'aparecer 0.7s ease-out 0.56s both' }}>
          <svg viewBox="0 0 300 340" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
            className="w-[220px] h-auto cursor-pointer select-none"
            onClick={() => setLampadaLigada(!lampadaLigada)}
          >
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="12" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <radialGradient id="luzGradiente" cx="50%" cy="30%" r="60%">
                <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="haloLuz" cx="50%" cy="35%" r="50%">
                <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.5" />
                <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Halo de luz - aparece ao ligar */}
            <circle cx="150" cy="90" r="90"
              fill="url(#haloLuz)"
              style={{
                opacity: lampadaLigada ? 1 : 0,
                transition: 'opacity 0.6s ease-in-out',
              }}
            />

            {/* Linhas de brilho - aparecem ao ligar */}
            <g style={{ opacity: lampadaLigada ? 1 : 0, transition: 'opacity 0.5s ease-in-out 0.1s' }}>
              <line x1="150" y1="14" x2="150" y2="28" stroke="#FDE68A" strokeWidth="2.5" filter="url(#glow)" />
              <line x1="112" y1="26" x2="120" y2="38" stroke="#FDE68A" strokeWidth="2.5" filter="url(#glow)" />
              <line x1="188" y1="26" x2="180" y2="38" stroke="#FDE68A" strokeWidth="2.5" filter="url(#glow)" />
              <line x1="96" y1="60" x2="110" y2="60" stroke="#FDE68A" strokeWidth="2.5" filter="url(#glow)" />
              <line x1="204" y1="60" x2="190" y2="60" stroke="#FDE68A" strokeWidth="2.5" filter="url(#glow)" />
            </g>

            {/* Linhas de brilho - desligadas */}
            <g style={{ opacity: lampadaLigada ? 0 : 1, transition: 'opacity 0.3s ease-in-out' }}>
              <line x1="150" y1="14" x2="150" y2="28" stroke="#E8A93B" strokeWidth="1.6" />
              <line x1="112" y1="26" x2="120" y2="38" stroke="#E8A93B" strokeWidth="1.6" />
              <line x1="188" y1="26" x2="180" y2="38" stroke="#E8A93B" strokeWidth="1.6" />
              <line x1="96" y1="60" x2="110" y2="60" stroke="#E8A93B" strokeWidth="1.6" />
              <line x1="204" y1="60" x2="190" y2="60" stroke="#E8A93B" strokeWidth="1.6" />
            </g>

            {/* Bulbo da lâmpada - preenchimento de luz */}
            <path d="M150 40C130 40 114 56 114 76c0 15 9 24 15 30 4 4 6 7 6 11h30c0-4 2-7 6-11 6-6 15-15 15-30 0-20-16-36-36-36z"
              fill={lampadaLigada ? 'url(#luzGradiente)' : 'none'}
              stroke={lampadaLigada ? '#FDE68A' : '#E8A93B'}
              strokeWidth={lampadaLigada ? '2.2' : '1.8'}
              filter={lampadaLigada ? 'url(#glow)' : 'none'}
              style={{ transition: 'all 0.5s ease-in-out' }}
            />

            {/* Letra L */}
            <text x="150" y="90" textAnchor="middle" fontFamily="Space Grotesk" fontSize="26"
              fill={lampadaLigada ? '#FDE68A' : '#F5F4EF'}
              fontWeight="600"
              style={{ transition: 'fill 0.5s ease-in-out' }}
            >L</text>

            {/* Base da lâmpada */}
            <g style={{ transition: 'opacity 0.4s ease-in-out' }}>
              <line x1="129" y1="117" x2="171" y2="117" stroke="#F5F4EF" strokeWidth="1.6" />
              <path d="M133 117 L133 128 L167 128 L167 117" stroke="#F5F4EF" strokeWidth="1.6" fill="none" />
              <path d="M142 128 L142 140 L158 140 L158 128" stroke="#F5F4EF" strokeWidth="1.4" fill="none" />
              <path d="M148 140 L148 150" stroke="#F5F4EF" strokeWidth="1.4" />
            </g>

            {/* Cristal / power indicator */}
            <polygon points="150,152 156,158 150,164 144,158"
              fill={lampadaLigada ? '#FDE68A' : '#E8A93B'}
              fillOpacity={lampadaLigada ? '0.8' : '0.25'}
              stroke={lampadaLigada ? '#FDE68A' : '#E8A93B'}
              strokeWidth="1.4"
              filter={lampadaLigada ? 'url(#glow)' : 'none'}
              style={{ transition: 'all 0.4s ease-in-out' }}
            />

            {/* Mesa / prateleira */}
            <polygon points="90,190 210,190 170,250 50,250"
              stroke="#F5F4EF" strokeOpacity={lampadaLigada ? '0.55' : '0.35'}
              strokeWidth="1.4" fill="none"
              style={{ transition: 'stroke-opacity 0.5s ease-in-out' }}
            />
            <polygon points="105,205 195,205 165,238 75,238"
              stroke="#F5F4EF" strokeOpacity={lampadaLigada ? '0.7' : '0.5'}
              strokeWidth="1.4" fill="none"
              style={{ transition: 'stroke-opacity 0.5s ease-in-out' }}
            />
          </svg>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto py-[70px] px-6">
        <h2 className="text-center text-4xl font-[Georgia,serif]" style={{ color: 'var(--cor-laranja-claro)' }}>
          Escolha o seu universo
        </h2>
        <p className="mt-4 text-center" style={{ color: 'var(--cor-texto-suave)' }}>
          Toque em um gênero e entre em uma página com a cara dele.
        </p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {generos.map((genero) => (
            <button
              key={genero.id}
              onClick={() => onSelecionarGenero(genero.id)}
              className="group relative h-[340px] overflow-hidden rounded-[24px] cursor-pointer border-none text-left shadow-[0_10px_30px_rgba(0,0,0,0.15)]"
            >
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
          {generos.map((genero) => (
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

        <div id="destaques" className="mt-[100px]">
          <div className="flex items-end justify-between">
            <div>
              <span
                className="inline-block px-4 py-1.5 rounded-full text-sm font-medium"
                style={{ background: 'var(--cor-laranja)', color: 'var(--cor-texto)' }}
              >
                Destaques da loja
              </span>
              <h2 className="mt-3 text-4xl font-[Georgia,serif]" style={{ color: 'var(--cor-texto)' }}>
                Peças favoritas dos leitores
              </h2>
              <p className="mt-2" style={{ color: 'var(--cor-texto-suave)' }}>
                As mais pedidas de cada universo, prontas para encomenda.
              </p>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[30px]">
            {destaque.map((produto, i) => (
              <Reveal key={produto.id} delay={i * 90}>
                <Card
                  id={produto.id}
                  nome={produto.nome}
                  imagem={produto.imagem}
                  preco={produto.preco}
                  estoque={produto.estoque}
                  tipo={produto.tipo}
                  permiteUpload={produto.permiteUpload}
                  onClick={() => onSelecionarProduto(produto)}
                  favorito={favoritos.some((f) => f.id === produto.id)}
                  onToggleFavorito={() => onToggleFavorito(produto)}
                />
              </Reveal>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}

export default Entrada