import { useState, useEffect } from 'react'
import NichoFormModal from '../ui/NichoFormModal'
import SimuladorFrete from '../sections/SimuladorFrete'
import Hero from './entrada/Hero'
import BannerNichos from './entrada/BannerNichos'
import SecaoUniversos from './entrada/SecaoUniversos'
import SecaoPorQueLume from './entrada/SecaoPorQueLume'
import SecaoDestaques from './entrada/SecaoDestaques'
import SecaoNewsletter from './entrada/SecaoNewsletter'

function Entrada({ produtos, nichos, onSelecionarGenero, onSelecionarProduto, favoritos, onToggleFavorito, admin = false, onEditarProduto, onSalvarNichos, onExcluirNichos }) {
  const [nichoEditando, setNichoEditando] = useState(null)
  // Banner full: slideshow de nichos acima de "Escolha o seu universo".
  const [slideBanner, setSlideBanner] = useState(0)
  const [bannerPausado, setBannerPausado] = useState(false)

  // Troca de imagem a cada 7s; pausa quando o mouse está sobre o banner
  // (para o cliente ler e clicar sem o slide mudar na cara dele).
  useEffect(() => {
    if (nichos.length < 2 || bannerPausado) return undefined
    const timer = setInterval(() => setSlideBanner((atual) => atual + 1), 7000)
    return () => clearInterval(timer)
  }, [nichos.length, bannerPausado])

  const indiceBanner = nichos.length > 0 ? ((slideBanner % nichos.length) + nichos.length) % nichos.length : 0
  const nichoBanner = nichos[indiceBanner]
  const destaque = [1, 11, 15, 9]
    .map((id) => produtos.find((p) => p.id === id))
    .filter(Boolean)

  return (
    <section>
      <Hero />

      {nichoBanner && (
        <BannerNichos
          nichos={nichos}
          nichoBanner={nichoBanner}
          indiceBanner={indiceBanner}
          onSelecionarGenero={onSelecionarGenero}
          onSelecionarSlide={setSlideBanner}
          onPausar={() => setBannerPausado(true)}
          onRetomar={() => setBannerPausado(false)}
        />
      )}

      <div className="max-w-[1200px] mx-auto py-[70px] px-6">
        <SecaoUniversos
          nichos={nichos}
          admin={admin}
          onSelecionarGenero={onSelecionarGenero}
          onNovoNicho={() => setNichoEditando('novo')}
          onEditarNicho={setNichoEditando}
        />

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
    </section>
  )
}

export default Entrada
