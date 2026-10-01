import { useState } from 'react'
import { api } from '../../../api'

function SecaoNewsletter() {
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterAceite, setNewsletterAceite] = useState(false)
  const [newsletterEnviado, setNewsletterEnviado] = useState(false)
  const [newsletterErro, setNewsletterErro] = useState('')

  return (
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
                  await api.newsletter(newsletterEmail, newsletterAceite)
                  setNewsletterEnviado(true)
                  setNewsletterEmail('')
                  setNewsletterAceite(false)
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
            <label
              className="flex items-start gap-2 text-xs mt-4 max-w-lg cursor-pointer"
              style={{ color: 'var(--cor-texto-suave)' }}
            >
              <input
                type="checkbox"
                checked={newsletterAceite}
                onChange={(e) => setNewsletterAceite(e.target.checked)}
                required
                className="mt-0.5"
              />
              Aceito receber novidades e ofertas da Lume por e-mail. Posso cancelar a inscrição a
              qualquer momento.
            </label>
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
  )
}

export default SecaoNewsletter
