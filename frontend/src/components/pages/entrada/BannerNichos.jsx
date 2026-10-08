import BannerFormModal from '../../ui/BannerFormModal'
import { useState } from 'react'

// Imagens próprias do banner (pasta public/), usadas só quando o admin ainda
// não cadastrou banners no banco — aí o slideshow monta 1 slide por nicho.
const IMAGENS_BANNER = {
  'brinq-sensorial': `${import.meta.env.BASE_URL}banner_sensorial.jpg`,
  'articulados': `${import.meta.env.BASE_URL}banner_articulado.jpeg`,
  'dinossauros': `${import.meta.env.BASE_URL}banner_dino2.jpg`,
  'pacotes': `${import.meta.env.BASE_URL}banner_box.jpg`,
}

// Slides do slideshow: banners do banco (imagem + nicho de destino) ou,
// se o admin ainda não cadastrou nenhum, um fallback por nicho.
export function montarSlidesBanner(banners, nichos) {
  if (banners.length > 0) {
    return banners.map((b) => ({
      id: b.id,
      src: b.imagem,
      genero: b.genero,
      nome: nichos.find((n) => n.id === b.genero)?.nome ?? '',
      real: true,
      banner: b,
    }))
  }
  return nichos.map((genero) => ({
    id: `nicho-${genero.id}`,
    src: IMAGENS_BANNER[genero.id] ?? genero.imagem,
    genero: genero.id,
    nome: genero.nome,
    real: false,
    banner: null,
  }))
}

function BannerNichos({
  banners,
  nichos,
  admin = false,
  indiceBanner,
  onSelecionarGenero,
  onSelecionarSlide,
  onPausar,
  onRetomar,
  onAdicionarBanner,
  onSalvarBanner,
  onExcluirBanner,
}) {
  const [bannerEditando, setBannerEditando] = useState(null)
  const slides = montarSlidesBanner(banners, nichos)
  const slideAtivo = slides[indiceBanner] ?? slides[0]
  if (!slideAtivo) return null

  return (
    <div
      className="banner-full w-full h-[240px] sm:h-[320px] lg:h-[400px] cursor-pointer relative"
      onMouseEnter={onPausar}
      onMouseLeave={onRetomar}
      // Clique em qualquer lugar do banner leva para o nicho do slide ativo.
      onClick={() => onSelecionarGenero(slideAtivo.genero)}
    >
      {slides.map((slide, i) => {
        const ativo = i === indiceBanner
        return (
          <div
            key={slide.id}
            aria-hidden={!ativo}
            className={`banner-slide absolute inset-0${ativo ? ' ativo' : ''}`}
          >
            <img
              src={slide.src}
              alt={slide.nome}
              className="block h-full w-full object-cover"
            />
          </div>
        )
      })}

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/25 pointer-events-none" />

      {admin && (
        <div
          className="absolute top-3 right-3 z-10 flex gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {slideAtivo.real && (
            <button
              type="button"
              onClick={() => setBannerEditando(slideAtivo.banner)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-white cursor-pointer border-none transition-transform duration-300 hover:scale-105"
              style={{ background: 'rgba(0,0,0,0.55)' }}
              title="Editar este banner"
            >
              Editar
            </button>
          )}
          <button
            type="button"
            onClick={onAdicionarBanner}
            className="px-3 py-1.5 rounded-full text-xs font-semibold text-white cursor-pointer border-none transition-transform duration-300 hover:scale-105"
            style={{ background: 'var(--cor-laranja)' }}
            title="Adicionar banner ao slideshow"
          >
            + Banner
          </button>
        </div>
      )}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
        <button
          key={slideAtivo.id}
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onSelecionarGenero(slideAtivo.genero)
          }}
          className="banner-conteudo px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-white cursor-pointer border-none transition-transform duration-300 hover:scale-105"
          style={{ background: 'var(--cor-laranja)', animationDelay: '160ms', boxShadow: '0 4px 14px rgba(0,0,0,0.35)' }}
        >
          Explorar
        </button>

        <div className="flex items-center gap-3">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={(e) => {
                // Troca de slide sem navegar para o nicho (clique não sobe pro banner).
                e.stopPropagation()
                onSelecionarSlide(i)
              }}
              aria-label={`Mostrar banner ${slide.nome || `${i + 1}`}`}
              className="h-2.5 rounded-full cursor-pointer border-none transition-all duration-300"
              style={{
                width: i === indiceBanner ? '26px' : '10px',
                background: i === indiceBanner ? 'var(--cor-laranja-claro)' : 'rgba(255,255,255,0.45)',
              }}
            />
          ))}
        </div>
      </div>

      {bannerEditando && (
        <div onClick={(e) => e.stopPropagation()}>
          <BannerFormModal
            banner={bannerEditando}
            nichos={nichos}
            onSalvar={(dados) => {
              onSalvarBanner(dados)
              setBannerEditando(null)
            }}
            onFechar={() => setBannerEditando(null)}
            onExcluir={(id) => {
              onExcluirBanner(id)
              setBannerEditando(null)
            }}
          />
        </div>
      )}
    </div>
  )
}

export default BannerNichos
