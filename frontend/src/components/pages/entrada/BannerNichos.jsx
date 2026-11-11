import BannerFormModal from '../../ui/BannerFormModal'
import { useState } from 'react'
import { montarSlidesBanner, versaoMobile } from './bannerSlides'

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
      className="banner-full w-full cursor-pointer relative"
      onMouseEnter={onPausar}
      onMouseLeave={onRetomar}
      // Clique em qualquer lugar do banner leva para o nicho do slide ativo.
      onClick={() => onSelecionarGenero(slideAtivo.genero)}
    >
      {slides.map((slide, i) => {
        const ativo = i === indiceBanner
        const mobile = versaoMobile(slide.src)
        return (
          <div
            key={slide.id}
            aria-hidden={!ativo}
            className={`banner-slide absolute inset-0${ativo ? ' ativo' : ''}`}
          >
            {/* A altura (CSS @media) já acompanha a proporção da arte, então
                object-cover preenche tudo sem cortar os lados. */}
            <picture>
              {mobile && <source media="(max-width: 640px)" srcSet={mobile} />}
              <img
                src={slide.src}
                alt={slide.nome}
                className="block h-full w-full object-cover"
              />
            </picture>
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
            style={{ background: 'var(--cor-esverdiado-bts)' }}
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
          style={{ background: 'var(--cor-esverdiado-bts)', animationDelay: '160ms', boxShadow: '0 4px 14px rgba(0,0,0,0.35)' }}
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
                background: i === indiceBanner ? 'var(--cor-esverdiado)' : 'rgba(255,255,255,0.45)',
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
