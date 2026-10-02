// Imagens próprias do banner (pasta public/), que valem só no slideshow —
// a imagem do nicho nas outras seções continua vindo do cadastro.
const IMAGENS_BANNER = {
  'brinq-sensorial': `${import.meta.env.BASE_URL}banner_sensorial.jpg`,
  'articulados': `${import.meta.env.BASE_URL}banner_articulado.jpeg`,
  'colecionaveis': `${import.meta.env.BASE_URL}banner_dino2.jpg`,
  'pacotes': `${import.meta.env.BASE_URL}banner_box.jpg`,
}

function BannerNichos({
  nichos,
  nichoBanner,
  indiceBanner,
  onSelecionarGenero,
  onSelecionarSlide,
  onPausar,
  onRetomar,
}) {
  return (
    <div
      className="banner-full w-full h-[240px] sm:h-[320px] lg:h-[400px] cursor-pointer"
      onMouseEnter={onPausar}
      onMouseLeave={onRetomar}
      // Clique em qualquer lugar do banner leva para o nicho do slide ativo.
      onClick={() => onSelecionarGenero(nichoBanner.id)}
    >
      {nichos.map((genero, i) => {
        const src = IMAGENS_BANNER[genero.id] ?? genero.imagem
        const ativo = i === indiceBanner
        return (
          <div
            key={genero.id}
            aria-hidden={!ativo}
            className={`banner-slide absolute inset-0${ativo ? ' ativo' : ''}`}
          >
            <img
              src={src}
              alt={genero.nome}
              className="block h-full w-full object-cover"
            />
          </div>
        )
      })}

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/25 pointer-events-none" />

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
        <button
          key={nichoBanner.id}
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onSelecionarGenero(nichoBanner.id)
          }}
          className="banner-conteudo px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-white cursor-pointer border-none transition-transform duration-300 hover:scale-105"
          style={{ background: 'var(--cor-laranja)', animationDelay: '160ms', boxShadow: '0 4px 14px rgba(0,0,0,0.35)' }}
        >
          Explorar
        </button>

        <div className="flex items-center gap-3">
          {nichos.map((genero, i) => (
            <button
              key={genero.id}
              type="button"
              onClick={(e) => {
                // Troca de slide sem navegar para o nicho (clique não sobe pro banner).
                e.stopPropagation()
                onSelecionarSlide(i)
              }}
              aria-label={`Mostrar banner ${genero.nome}`}
              className="h-2.5 rounded-full cursor-pointer border-none transition-all duration-300"
              style={{
                width: i === indiceBanner ? '26px' : '10px',
                background: i === indiceBanner ? 'var(--cor-laranja-claro)' : 'rgba(255,255,255,0.45)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default BannerNichos
