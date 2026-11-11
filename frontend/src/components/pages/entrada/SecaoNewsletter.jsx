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
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-10" style={{ background: 'var(--cor-esverdiado-bts)' }} />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full opacity-5" style={{ background: 'var(--cor-esverdiado-bts)' }} />
        <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--cor-esverdiado-bts)' }}>
              Comunidade de Leitores
            </span>
            <h2 className="font-[Georgia,serif] text-3xl md:text-4xl mt-2 mb-4" style={{ color: 'var(--cor-texto)' }}>
              Receba novidades e ofertas exclusivas
            </h2>
            <p className="text-sm md:text-base mb-8 leading-relaxed" style={{ color: 'var(--cor-texto-suave)' }}>
              Cadastre-se para ser o primeiro a saber quando novos universos literários forem lançados na Lume 3D.
            </p>
            {newsletterEnviado ? (
              <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--cor-esverdiado-bts)' }}>
                
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
                  className="flex-1 px-4 py-3.5 rounded-lg text-sm focus:outline-none focus:border-[var(--cor-esverdiado-bts)]"
                  style={{ background: 'var(--cor-fundo)', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto)' }}
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="px-8 py-3.5 font-semibold text-sm rounded-lg transition-colors whitespace-nowrap shadow-md hover:opacity-90"
                  style={{ background: 'var(--cor-esverdiado-bts)', color: 'var(--cor-texto)' }}
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
            <img src={`${import.meta.env.BASE_URL}./public/IDENTIDADE VISUAL LOCUS/locu-portal.png`} alt="Lume 3D" className="w-80 h-auto rounded-lg shadow-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SecaoNewsletter
