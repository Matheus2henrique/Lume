import { useState, useEffect } from 'react'
import NichoFormModal from '../ui/NichoFormModal'
import BannerFormModal from '../ui/BannerFormModal'
import SimuladorFrete from '../sections/SimuladorFrete'
import Hero from './entrada/Hero'
import BannerNichos, { montarSlidesBanner } from './entrada/BannerNichos'
// import SecaoUniversos from './entrada/SecaoUniversos'
import SecaoPorQueLume from './entrada/SecaoPorQueLume'
import SecaoDestaques from './entrada/SecaoDestaques'
import SecaoNewsletter from './entrada/SecaoNewsletter'

function Entrada({ produtos, nichos, banners = [], onSelecionarGenero, onSelecionarProduto, favoritos, onToggleFavorito, admin = false, onEditarProduto, onSalvarNichos, onExcluirNichos, onSalvarBanner, onExcluirBanner }) {
  const [nichoEditando, setNichoEditando] = useState(null)
  // Formulário de novo banner (admin): null = fechado.
  const [novoBanner, setNovoBanner] = useState(false)
  // Banner full: slideshow da home acima de "Escolha o seu universo".
  const [slideBanner, setSlideBanner] = useState(0)
  const [bannerPausado, setBannerPausado] = useState(false)

  const slides = montarSlidesBanner(banners, nichos)
  const totalSlides = slides.length

  // Troca de imagem a cada 7s; pausa quando o mouse está sobre o banner
  // (para o cliente ler e clicar sem o slide mudar na cara dele).
  useEffect(() => {
    if (totalSlides < 2 || bannerPausado) return undefined
    const timer = setInterval(() => setSlideBanner((atual) => atual + 1), 7000)
    return () => clearInterval(timer)
  }, [totalSlides, bannerPausado])

  const indiceBanner = totalSlides > 0 ? ((slideBanner % totalSlides) + totalSlides) % totalSlides : 0
  const destaque = produtos.slice(0, 4)

  return (
    <section>
      <Hero />

      {totalSlides > 0 && (
        <BannerNichos
          banners={banners}
          nichos={nichos}
          admin={admin}
          indiceBanner={indiceBanner}
          onSelecionarGenero={onSelecionarGenero}
          onSelecionarSlide={setSlideBanner}
          onPausar={() => setBannerPausado(true)}
          onRetomar={() => setBannerPausado(false)}
          onAdicionarBanner={() => setNovoBanner(true)}
          onSalvarBanner={onSalvarBanner}
          onExcluirBanner={onExcluirBanner}
        />
      )}

      <div className="max-w-[1200px] mx-auto py-[70px] px-6">
        {/* <SecaoUniversos
          nichos={nichos}
          admin={admin}
          onSelecionarGenero={onSelecionarGenero}
          onNovoNicho={() => setNichoEditando('novo')}
          onEditarNicho={setNichoEditando}
        /> */}

        <SecaoPorQueLume nichos={nichos} />

        <SecaoDestaques
          destaque={destaque}
          favoritos={favoritos}
          onSelecionarProduto={onSelecionarProduto}
          onToggleFavorito={onToggleFavorito}
          admin={admin}
          onEditarProduto={onEditarProduto}
        />

        <SimuladorFrete />
      </div>

      <SecaoNewsletter />

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

      {novoBanner && (
        <BannerFormModal
          banner={null}
          nichos={nichos}
          onSalvar={(dados) => {
            onSalvarBanner(dados)
            setNovoBanner(false)
          }}
          onFechar={() => setNovoBanner(false)}
        />
      )}
    </section>
  )
}

export default Entrada
