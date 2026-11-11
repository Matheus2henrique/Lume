const BASE = import.meta.env.BASE_URL

function SecaoConviteLeitura({ onExplorar, temaLeitura = false }) {
  // No modo claro os textos viram os do /literatura do modelo e as
  // imagens trocam de lugar com o Hero.
  const imagem = temaLeitura ? 'locu.png' : 'locu-lendo.png'

  if (temaLeitura) {
    return (
      <section className="reading-invitation">
        <div className="reading-invitation-copy">
          <h2>
            Sua próxima história
            <br />
            <em>mora nas nuvens.</em>
          </h2>
          <p>
            Encontre um lugar para pousar a imaginação.
            <br />
            Entre romances, fantasias e mistérios, uma nova história está
            esperando por você.
          </p>
          <button type="button" className="reading-button" onClick={onExplorar}>
            Encontre sua próxima leitura
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7 17 17 7" />
              <path d="M7 7h10v10" />
            </svg>
          </button>
          <span className="reading-hero-signature">
            Seu lugar para criar, imaginar e pertencer.
          </span>
        </div>
        <div className="reading-invitation-art">
          <img src={`${BASE}./public/IDENTIDADE VISUAL LOCUS/${imagem}`} alt="Locus por Leitura" />
        </div>
      </section>
    )
  }

  return (
    <section className="reading-invitation">
      <div className="reading-invitation-copy">
        <span className="reading-mini-brand">
          LOCUS <i>por Leitura</i>
        </span>
        <h2>
          Um respiro.
          <br />
          <em>Uma nova história.</em>
        </h2>
        <p>
          Do outro lado deste portal, o tempo desacelera e a imaginação mora nas
          nuvens.
        </p>
        <button type="button" className="reading-button" onClick={onExplorar}>
          Entre na Locus por Leitura
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7 17 17 7" />
            <path d="M7 7h10v10" />
          </svg>
        </button>
      </div>
      <div className="reading-invitation-art">
        <img src={`${BASE}./public/IDENTIDADE VISUAL LOCUS/${imagem}`} alt="Convite para leitura" />
      </div>
    </section>
  )
}

export default SecaoConviteLeitura
