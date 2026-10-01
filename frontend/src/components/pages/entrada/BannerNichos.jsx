// Imagens próprias do banner (pasta public/), que valem só no slideshow —
// a imagem do nicho nas outras seções continua vindo do cadastro.
const IMAGENS_BANNER = {
  'brinq-sensorial': `${import.meta.env.BASE_URL}banner_sensorial.jpg`,
  pacotes: `${import.meta.env.BASE_URL}banner_box.jpg`,
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
      className="banner-full w-full h-[240px] sm:h-[320px] lg:h-[400px]"
      onMouseEnter={onPausar}
      onMouseLeave={onRetomar}
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

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/25" />

      <div key={nichoBanner.id} className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        <span
          className="banner-conteudo inline-block px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium bg-white/15 backdrop-blur-sm text-white/90"
          style={{ animationDelay: '60ms' }}
        >
          {nichoBanner.tagline}
        </span>
        <h2
          className="banner-conteudo mt-3 text-3xl sm:text-4xl lg:text-5xl font-[Georgia,serif] text-white"
          style={{ animationDelay: '160ms' }}
        >
          {nichoBanner.nome}
        </h2>
        <button
          type="button"
          onClick={() => onSelecionarGenero(nichoBanner.id)}
          className="banner-conteudo mt-5 px-6 py-3 rounded-full text-sm font-semibold text-white cursor-pointer border-none transition-transform duration-300 hover:scale-105"
          style={{ background: 'var(--cor-laranja)', animationDelay: '260ms', boxShadow: '0 10px 25px rgba(0,0,0,0.35)' }}
        >
          Conhecer {nichoBanner.nome} →
        </button>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {nichos.map((genero, i) => (
          <button
            key={genero.id}
            type="button"
            onClick={() => onSelecionarSlide(i)}
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
  )
}

export default BannerNichos
