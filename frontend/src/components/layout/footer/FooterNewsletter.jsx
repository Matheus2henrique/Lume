import { useState } from 'react'
import { Check } from '../../ui/Icones'
import { api } from '../../../api'

function FooterNewsletter() {
  const [email, setEmail] = useState('')
  const [aceite, setAceite] = useState(false)
  const [inscrito, setInscrito] = useState(false)
  const [erro, setErro] = useState('')

  async function handleNewsletter(e) {
    e.preventDefault()
    setErro('')
    try {
      await api.newsletter(email, aceite)
      setInscrito(true)
      setEmail('')
      setAceite(false)
    } catch (err) {
      setErro(err.message)
    }
  }

  return (
    <div className="order-6 col-span-2 lg:col-span-5">
      <h4 className="text-sm font-semibold mb-4" style={{ color: 'var(--cor-texto)' }}>
        Receba novidades e ofertas exclusivas!
      </h4>
      {inscrito ? (
        <div
          className="flex items-center gap-2 text-sm font-medium"
          style={{ color: 'var(--cor-primaria)' }}
        >
          <Check className="w-4 h-4" />
          Inscrição confirmada!
        </div>
      ) : (
        <>
          <form onSubmit={handleNewsletter} className="flex gap-2">
            <input
              type="email"
              required
              placeholder="Seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none border transition-all"
              style={{
                background: 'var(--cor-fundo-cartao)',
                color: 'var(--cor-texto)',
                borderColor: 'var(--cor-borda)',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--cor-primaria)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--cor-borda)')}
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-white text-sm font-semibold cursor-pointer transition-all duration-300 hover:scale-105 border-none"
              style={{ background: 'var(--cor-laranja)' }}
            >
              Enviar
            </button>
          </form>
          <label
            className="flex items-start gap-2 text-xs mt-3 max-w-xl cursor-pointer"
            style={{ color: 'var(--cor-texto-suave)' }}
          >
            <input
              type="checkbox"
              checked={aceite}
              onChange={(e) => setAceite(e.target.checked)}
              required
              className="mt-0.5"
            />
            Aceito receber novidades e ofertas da Lume por e-mail. Posso cancelar a inscrição a
            qualquer momento.
          </label>
          {erro && <p className="text-xs mt-2" style={{ color: '#ef4444' }}>{erro}</p>}
        </>
      )}
      <p className="mt-8 text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
        © {new Date().getFullYear()} Lume. Todos os direitos reservados.
      </p>
    </div>
  )
}

export default FooterNewsletter
