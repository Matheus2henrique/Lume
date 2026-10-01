import BlocoContato from './BlocoContato'

function Hero() {
  return (
    <div className="min-h-[380px] md:min-h-[420px] flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-10 lg:gap-5 px-5 md:px-6 lg:pl-[max(1.5rem,calc((100vw_-_1200px)/2_+_1.5rem))] lg:pr-[max(1.5rem,calc((100vw_-_1200px)/2_+_1.5rem))] relative overflow-hidden"
      style={{ background: '#0a0a0a' }}
    >
      <div className="absolute top-1/2 left-[20%] -translate-y-1/2 w-[500px] h-[300px] rounded-full opacity-30 blur-[120px]" style={{ background: 'var(--cor-laranja)' }} />
      <div className="absolute top-1/2 left-[35%] -translate-y-1/2 w-[250px] h-[200px] rounded-full opacity-15 blur-[80px]" style={{ background: 'var(--cor-laranja-claro)' }} />
      <div className="w-full lg:w-auto lg:flex-1 lg:order-2 lg:-translate-x-[300px]">
        <span
          className="block tracking-[6px] pl-[8px] text-xs md:text-sm text-center"
          style={{ color: 'var(--cor-laranja-claro)', animation: 'aparecer 0.7s ease-out 0.12s both' }}
        >
          PARA QUEM VIVE DENTRO DOS LIVROS
        </span>
        <h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl leading-[0.95] my-5 font-[Georgia,serif] text-center"
          style={{ color: 'var(--cor-texto)', animation: 'aparecer 0.7s ease-out 0.28s both' }}
        >
          <span style={{ color: 'var(--cor-laranja-claro)' }}>Lume</span> — onde suas
          <br />
          histórias ganham forma
        </h1>
        <p
          className="text-lg sm:text-xl max-w-[560px] mx-auto text-center"
          style={{ color: 'var(--cor-texto-suave)', animation: 'aparecer 0.7s ease-out 0.44s both' }}
        >
          Decorações e colecionáveis para os leitores que querem
          levar o seu gênero favorito para todos os cantos.
        </p>
      </div>
      <div className="flex flex-row lg:flex-col items-center justify-start gap-4 sm:gap-6 lg:gap-0 flex-shrink-0 lg:order-3 lg:w-[180px] xl:w-[220px] lg:-translate-x-[105px]" style={{ animation: 'aparecer 0.7s ease-out 0.56s both' }}>
        <svg viewBox="0 0 300 180" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
          className="w-[110px] sm:w-[150px] lg:w-[160px] xl:w-[220px] h-auto"
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
        </svg>
        <BlocoContato className="items-center text-center lg:mt-7" />
      </div>
      <div aria-hidden="true" className="hidden lg:block shrink-0 lg:order-1 lg:w-[180px] xl:w-[220px]" />
    </div>
  )
}

export default Hero
