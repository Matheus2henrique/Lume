import { useState } from 'react'
import Card from '../ui/Card'
import Reveal from '../ui/Reveal'
import NichoFormModal from '../ui/NichoFormModal'
import { api } from '../../api'

function Entrada({ produtos, nichos, onSelecionarGenero, onSelecionarProduto, favoritos, onToggleFavorito, admin = false, onEditarProduto, onSalvarNichos, onExcluirNichos }) {
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterEnviado, setNewsletterEnviado] = useState(false)
  const [newsletterErro, setNewsletterErro] = useState('')
  const [nichoEditando, setNichoEditando] = useState(null)
  const destaque = [1, 11, 15, 9]
    .map((id) => produtos.find((p) => p.id === id))
    .filter(Boolean)

  return (
    <section>
      <div className="min-h-[380px] md:min-h-[420px] flex items-center justify-between px-5 md:px-6 lg:pl-[calc((100vw-1200px)/2+1.5rem)] lg:pr-[calc((100vw-1200px)/2+1.5rem)] relative overflow-hidden"
        style={{ background: '#0a0a0a' }}
      >
        <div className="absolute top-1/2 left-[20%] -translate-y-1/2 w-[500px] h-[300px] rounded-full opacity-30 blur-[120px]" style={{ background: 'var(--cor-laranja)' }} />
        <div className="absolute top-1/2 left-[35%] -translate-y-1/2 w-[250px] h-[200px] rounded-full opacity-15 blur-[80px]" style={{ background: 'var(--cor-laranja-claro)' }} />
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
            className="w-[220px] h-auto"
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

            <circle cx="150" cy="90" r="90" fill="url(#haloLuz)" opacity="0" />

            <g>
              <line x1="150" y1="14" x2="150" y2="28" stroke="#E8A93B" strokeWidth="1.6" />
              <line x1="112" y1="26" x2="120" y2="38" stroke="#E8A93B" strokeWidth="1.6" />
              <line x1="188" y1="26" x2="180" y2="38" stroke="#E8A93B" strokeWidth="1.6" />
              <line x1="96" y1="60" x2="110" y2="60" stroke="#E8A93B" strokeWidth="1.6" />
              <line x1="204" y1="60" x2="190" y2="60" stroke="#E8A93B" strokeWidth="1.6" />
            </g>

            <path d="M150 40C130 40 114 56 114 76c0 15 9 24 15 30 4 4 6 7 6 11h30c0-4 2-7 6-11 6-6 15-15 15-30 0-20-16-36-36-36z"
              fill="none"
              stroke="#E8A93B"
              strokeWidth="1.8"
            />

            <text x="150" y="90" textAnchor="middle" fontFamily="Space Grotesk" fontSize="26"
              fill="#F5F4EF" fontWeight="600"
            >L</text>

            <g>
              <line x1="129" y1="117" x2="171" y2="117" stroke="#F5F4EF" strokeWidth="1.6" />
              <path d="M133 117 L133 128 L167 128 L167 117" stroke="#F5F4EF" strokeWidth="1.6" fill="none" />
              <path d="M142 128 L142 140 L158 140 L158 128" stroke="#F5F4EF" strokeWidth="1.4" fill="none" />
              <path d="M148 140 L148 150" stroke="#F5F4EF" strokeWidth="1.4" />
            </g>

            <polygon points="150,152 156,158 150,164 144,158"
              fill="#E8A93B" fillOpacity="0.25"
              stroke="#E8A93B" strokeWidth="1.4"
            />

            <polygon points="90,190 210,190 170,250 50,250"
              stroke="#F5F4EF" strokeOpacity="0.35"
              strokeWidth="1.4" fill="none"
            />
            <polygon points="105,205 195,205 165,238 75,238"
              stroke="#F5F4EF" strokeOpacity="0.5"
              strokeWidth="1.4" fill="none"
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
        {admin && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setNichoEditando('novo')}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full border-none cursor-pointer text-sm font-medium transition-transform hover:scale-105"
              style={{ background: 'var(--cor-laranja)', color: 'var(--cor-texto)' }}
            >
              <span className="text-lg leading-none">+</span> Novo nicho
            </button>
          </div>
        )}

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {nichos.map((genero) => (
            <button
              key={genero.id}
              onClick={() => onSelecionarGenero(genero.id)}
              className="group relative h-[340px] overflow-hidden rounded-[24px] cursor-pointer border-none text-left shadow-[0_10px_30px_rgba(0,0,0,0.15)]"
            >
              {admin && (
                <span
                  onClick={(e) => { e.stopPropagation(); setNichoEditando(genero) }}
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

        <div className="py-24 px-6 lg:px-12" style={{ background: 'linear-gradient(to bottom, transparent, var(--cor-fundo))' }}>
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div className="order-2 lg:order-1">
                <div className="relative">
                  <div className="absolute -inset-4 rounded-3xl blur-2xl opacity-20" style={{ background: 'linear-gradient(to right, var(--cor-laranja), transparent)' }} />
                  <div className="relative grid grid-cols-3 gap-3">
                    <div className="col-span-2 aspect-video rounded-2xl overflow-hidden" style={{ border: '1px solid var(--cor-borda)' }}>
                      <img src={nichos[0]?.imagem} alt={nichos[0]?.nome} className="w-full h-full object-cover" />
                    </div>
                    <div className="aspect-square rounded-2xl overflow-hidden" style={{ border: '1px solid var(--cor-borda)' }}>
                      <img src={nichos[1]?.imagem} alt={nichos[1]?.nome} className="w-full h-full object-cover" />
                    </div>
                    <div className="aspect-square rounded-2xl overflow-hidden" style={{ border: '1px solid var(--cor-borda)' }}>
                      <img src={nichos[2]?.imagem} alt={nichos[2]?.nome} className="w-full h-full object-cover" />
                    </div>
                    <div className="col-span-2 aspect-video rounded-2xl overflow-hidden" style={{ border: '1px solid var(--cor-borda)' }}>
                      <img src={nichos[3]?.imagem} alt={nichos[3]?.nome} className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2 space-y-8">
                <span className="inline-block px-4 py-2 rounded-full text-xs tracking-widest uppercase" style={{ background: 'color-mix(in srgb, var(--cor-laranja) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--cor-laranja) 30%, transparent)', color: 'var(--cor-laranja)' }}>
                  Por que Lume 3D
                </span>
                <h2 className="font-[Georgia,serif] text-3xl md:text-4xl lg:text-5xl" style={{ color: 'var(--cor-texto)' }}>
                  Feito com carinho, pensado para durar
                </h2>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--cor-laranja) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--cor-laranja) 30%, transparent)' }}>
                      <svg className="w-6 h-6" style={{ color: 'var(--cor-laranja)' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium mb-1" style={{ color: 'var(--cor-texto)' }}>Impressão 3D de alta qualidade</h3>
                      <p className="text-sm" style={{ color: 'var(--cor-texto-suave)' }}>Cada peça é impressa com precisão e acabamento profissional.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--cor-laranja) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--cor-laranja) 30%, transparent)' }}>
                      <svg className="w-6 h-6" style={{ color: 'var(--cor-laranja)' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium mb-1" style={{ color: 'var(--cor-texto)' }}>Design exclusivo para leitores</h3>
                      <p className="text-sm" style={{ color: 'var(--cor-texto-suave)' }}>Criações únicas inspiradas nos universos literários que você ama.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--cor-laranja) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--cor-laranja) 30%, transparent)' }}>
                      <svg className="w-6 h-6" style={{ color: 'var(--cor-laranja)' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium mb-1" style={{ color: 'var(--cor-texto)' }}>Envio para todo o Brasil</h3>
                      <p className="text-sm" style={{ color: 'var(--cor-texto-suave)' }}>Entrega segura e rastreável, do pedido até a sua porta.</p>
                    </div>
                  </div>
                </div>
            </div>
            
          </div>
          </div>
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
                  nome={produto.nome}
                  imagem={produto.imagem}
                  preco={produto.preco}
                  estoque={produto.estoque}
                  tipo={produto.tipo}
                  permiteUpload={produto.permiteUpload}
                  onClick={() => onSelecionarProduto(produto)}
                  favorito={favoritos.some((f) => f.id === produto.id)}
                  onToggleFavorito={() => onToggleFavorito(produto)}
                  admin={admin}
                  onEditarProduto={onEditarProduto}
                  produto={produto}
                />
              </Reveal>
            ))}
          </div>
        </div>

      </div>

      <div className="py-20 px-6 md:px-12" style={{ borderTop: '1px solid var(--cor-borda)' }}>
        <div
          className="max-w-7xl mx-auto rounded-3xl p-8 md:p-14 shadow-2xl relative overflow-hidden"
          style={{ background: 'linear-gradient(to right, var(--cor-fundo), var(--cor-borda), var(--cor-fundo))', border: '1px solid var(--cor-borda)' }}
        >
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-10" style={{ background: 'var(--cor-laranja)' }} />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full opacity-5" style={{ background: 'var(--cor-laranja)' }} />
          <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--cor-laranja)' }}>
                Comunidade de Leitores
              </span>
              <h2 className="font-[Georgia,serif] text-3xl md:text-4xl mt-2 mb-4" style={{ color: 'var(--cor-texto)' }}>
                Receba novidades e ofertas exclusivas
              </h2>
              <p className="text-sm md:text-base mb-8 leading-relaxed" style={{ color: 'var(--cor-texto-suave)' }}>
                Cadastre-se para ser o primeiro a saber quando novos universos literários forem lançados na Lume 3D.
              </p>
              {newsletterEnviado ? (
                <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--cor-laranja)' }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Inscrição confirmada!
                </div>
              ) : (
                <form className="flex flex-col sm:flex-row gap-3 max-w-lg" onSubmit={async (e) => {
                  e.preventDefault()
                  setNewsletterErro('')
                  try {
                    await api.newsletter(newsletterEmail)
                    setNewsletterEnviado(true)
                    setNewsletterEmail('')
                  } catch (err) {
                    setNewsletterErro(err.message)
                  }
                }}>
                  <input
                    type="email"
                    placeholder="Seu melhor e-mail"
                    className="flex-1 px-4 py-3.5 rounded-lg text-sm focus:outline-none focus:border-[var(--cor-laranja)]"
                    style={{ background: 'var(--cor-fundo)', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto)' }}
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    className="px-8 py-3.5 font-semibold text-sm rounded-lg transition-colors whitespace-nowrap shadow-md hover:opacity-90"
                    style={{ background: 'var(--cor-laranja)', color: 'var(--cor-texto)' }}
                  >
                    Enviar
                  </button>
                  {newsletterErro && (
                    <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{newsletterErro}</p>
                  )}
                </form>
              )}
            </div>
            <div className="hidden lg:flex justify-center">
              <svg viewBox="0 0 300 340" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
                className="w-[200px] h-auto"
              >
                <defs>
                  <filter id="glow2" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="12" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <radialGradient id="luzGradiente2" cx="50%" cy="30%" r="60%">
                    <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.9" />
                    <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="haloLuz2" cx="50%" cy="35%" r="50%">
                    <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.5" />
                    <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <circle cx="150" cy="90" r="90" fill="url(#haloLuz2)" />
                <g>
                  <line x1="150" y1="14" x2="150" y2="28" stroke="#FDE68A" strokeWidth="2.5" filter="url(#glow2)" />
                  <line x1="112" y1="26" x2="120" y2="38" stroke="#FDE68A" strokeWidth="2.5" filter="url(#glow2)" />
                  <line x1="188" y1="26" x2="180" y2="38" stroke="#FDE68A" strokeWidth="2.5" filter="url(#glow2)" />
                  <line x1="96" y1="60" x2="110" y2="60" stroke="#FDE68A" strokeWidth="2.5" filter="url(#glow2)" />
                  <line x1="204" y1="60" x2="190" y2="60" stroke="#FDE68A" strokeWidth="2.5" filter="url(#glow2)" />
                </g>
                <path d="M150 40C130 40 114 56 114 76c0 15 9 24 15 30 4 4 6 7 6 11h30c0-4 2-7 6-11 6-6 15-15 15-30 0-20-16-36-36-36z"
                  fill="url(#luzGradiente2)" stroke="#FDE68A" strokeWidth="2.2" filter="url(#glow2)" />
                <text x="150" y="90" textAnchor="middle" fontFamily="Space Grotesk" fontSize="26"
                  fill="#FDE68A" fontWeight="600">L</text>
                <g>
                  <line x1="129" y1="117" x2="171" y2="117" stroke="#F5F4EF" strokeWidth="1.6" />
                  <path d="M133 117 L133 128 L167 128 L167 117" stroke="#F5F4EF" strokeWidth="1.6" fill="none" />
                  <path d="M142 128 L142 140 L158 140 L158 128" stroke="#F5F4EF" strokeWidth="1.4" fill="none" />
                  <path d="M148 140 L148 150" stroke="#F5F4EF" strokeWidth="1.4" />
                </g>
                <polygon points="150,152 156,158 150,164 144,158"
                  fill="#FDE68A" fillOpacity="0.8" stroke="#FDE68A" strokeWidth="1.4" filter="url(#glow2)" />
                <polygon points="90,190 210,190 170,250 50,250"
                  stroke="#F5F4EF" strokeOpacity="0.55" strokeWidth="1.4" fill="none" />
                <polygon points="105,205 195,205 165,238 75,238"
                  stroke="#F5F4EF" strokeOpacity="0.7" strokeWidth="1.4" fill="none" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {nichoEditando !== null && (
        <NichoFormModal
          nicho={nichoEditando === 'novo' ? null : nichoEditando}
          onSalvar={(dados) => {
            onSalvarNichos(dados)
            setNichoEditando(null)
          }}
          onFechar={() => setNichoEditando(null)}
          onExcluir={(id) => {
            onExcluirNichos(id)
            setNichoEditando(null)
          }}
        />
      )}
    </section>
  )
}

export default Entrada