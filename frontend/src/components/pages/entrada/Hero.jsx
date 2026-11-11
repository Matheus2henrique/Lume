
function Hero({ temaLeitura = false }) {
  const imagem = temaLeitura ? 'locu-lendo.png' : 'locu.png'
  return (
    <div className="min-h-[400px] md:min-h-[520px] flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-10 lg:gap-5 px-5 md:px-6 lg:pl-[max(1.5rem,calc((100vw_-_1200px)/2_+_1.5rem))] lg:pr-[max(1.5rem,calc((100vw_-_1200px)/2_+_1.5rem))] relative overflow-hidden"
      style={{ background: 'var(--cor-fundo)', transition: 'background-color 0.25s' }}
    >
      <div className="absolute top-1/2 left-[20%] -translate-y-1/2 w-[500px] h-[300px] rounded-full opacity-30 blur-[120px]" style={{ background: 'var(--cor-esverdiado-bts)' }} />
      <div className="absolute top-1/2 left-[18%] -translate-y-1/2 w-[250px] h-[200px] rounded-full opacity-50 blur-[80px]" style={{ background: 'var(--cor-esverdiado)' }} />
      <div className="w-full lg:w-auto lg:flex-1 lg:order-2 lg:-translate-x-[300px]">
        <h1
          className="text-[clamp(68px,18vw,96px)] md:text-[72px] lg:text-[85px] xl:text-[100px] leading-[0.93] tracking-[-0.025em] max-w-[590px] my-5 font-[Barlow_Condensed,sans-serif] font-extrabold"
          style={{ color: 'var(--cor-texto)', animation: 'aparecer 0.7s ease-out 0.28s both' }}
        >
          Onde os{' '}
          <span style={{ color: 'var(--cor-esverdiado)', display: 'block' }}>mundos</span>
          <span
            style={{
              fontSize: '0.8em',
              color: 'var(--cor-texto)',
              whiteSpace: 'nowrap',
            }}
          >
            se encontram
          </span>
        </h1>
        <p
          className="text-[13px] leading-[1.9] max-w-[590px] mb-[27px]"
          style={{ color: 'var(--cor-texto-suave)', animation: 'aparecer 0.7s ease-out 0.44s both' }}
        >
          Decorações e colecionáveis para os leitores que querem
          <br />
          levar o seu gênero favorito para todos os cantos.
        </p>
      </div>
      <img
        key={imagem}
        src={`${import.meta.env.BASE_URL}./public/IDENTIDADE VISUAL LOCUS/${imagem}`}
        alt="Locus"
        className="h-100 w-120 object-cover lg:order-3"
        style={{ filter: 'drop-shadow(0 18px 35px rgba(121,0,213,0.09))', animation: 'float 7s ease-in-out infinite' }}
      />
      <div aria-hidden="true" className="hidden lg:block shrink-0 lg:order-1 lg:w-[180px] xl:w-[220px]" />
    </div>
  )
}

export default Hero
