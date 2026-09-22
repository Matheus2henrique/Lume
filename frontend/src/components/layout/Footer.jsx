import { useState } from 'react'
import { generos } from '../../data/produtos'
import { Check, Instagram, WhatsApp } from '../ui/Icones'
import { api } from '../../api'

const LINK_INSTAGRAM = 'https://www.instagram.com/3d_.lume/'
const LINK_WHATSAPP = '#' // TODO: colocar o link do WhatsApp quando for enviado

function Footer({ onHome, onSelecionarGenero, onIrParaDestaques }) {
  const [email, setEmail] = useState('')
  const [inscrito, setInscrito] = useState(false)
  const [erro, setErro] = useState('')

  async function handleNewsletter(e) {
    e.preventDefault()
    setErro('')
    try {
      await api.newsletter(email)
      setInscrito(true)
      setEmail('')
    } catch (err) {
      setErro(err.message)
    }
  }

  return (
    <footer
      className="mt-auto"
      style={{ background: 'var(--cor-fundo-suave)' }}
    >
      <div className="max-w-[1400px] mx-auto px-6 py-8 grid grid-cols-2 lg:grid-cols-5 gap-8 lg:divide-x divide-[var(--cor-borda)]">
        <div className="order-1 col-span-2 lg:col-span-1">
          <button onClick={onHome} className="border-none bg-transparent cursor-pointer flex items-center">
            <span
              className="flex items-center leading-none"
              style={{ fontFamily: 'Cinzel, Georgia, serif', color: 'var(--cor-texto)' }}
            >
              <img src={`${import.meta.env.BASE_URL}nome.jpeg`} alt="" className="h-9 w-9 rounded-full object-cover mx-0.5" />
            </span>
          </button>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--cor-texto-suave)' }}>
            Para quem vive dentro dos livros. Decorações e colecionáveis.
          </p>
        </div>

        <div className="order-2">
          <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: 'var(--cor-texto)' }}>
            Universos
          </h4>
          <ul className="flex flex-col gap-3 list-none">
            {generos.map((genero) => (
              <li key={genero.id}>
                <button
                  onClick={() => onSelecionarGenero(genero.id)}
                  className="bg-transparent border-none cursor-pointer text-sm"
                  style={{ color: 'var(--cor-texto-suave)' }}
                >
                  {genero.nome}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="order-3">
          <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: 'var(--cor-texto)' }}>
            Navegue
          </h4>
          <ul className="flex flex-col gap-3 list-none">
            <li>
              <button onClick={onIrParaDestaques} className="bg-transparent border-none cursor-pointer text-sm text-left" style={{ color: 'var(--cor-texto-suave)' }}>
                Produtos em Destaque
              </button>
            </li>
          </ul>
        </div>

        <div className="order-4">
          <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: 'var(--cor-texto)' }}>
            Ajuda
          </h4>
          <ul className="flex flex-col gap-3 list-none">
            {['Perguntas frequentes', 'Trocas e devoluções', 'Política de privacidade'].map((ajuda) => (
              <li key={ajuda}>
                <a href="#" className="text-sm" style={{ color: 'var(--cor-texto-suave)' }}>
                  {ajuda}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="order-5">
          <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: 'var(--cor-texto)' }}>
            Contato
          </h4>
          <ul className="flex flex-col gap-3 text-sm list-none" style={{ color: 'var(--cor-texto-suave)' }}>
            <li>ola@lume.com</li>
            <li>(11) 99999-9999</li>
            <li>Atendemos todo o Brasil</li>
          </ul>

          <div className="mt-5 flex items-center gap-3">
            <a
              href={LINK_INSTAGRAM}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram da Lume"
              title="Instagram"
              className="flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-300 hover:scale-110"
              style={{
                background: 'var(--cor-fundo-cartao)',
                borderColor: 'var(--cor-borda)',
                color: 'var(--cor-texto)',
              }}
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href={LINK_WHATSAPP}
              aria-label="WhatsApp da Lume"
              title="WhatsApp"
              {...(LINK_WHATSAPP !== '#' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-300 hover:scale-110"
              style={{
                background: 'var(--cor-fundo-cartao)',
                borderColor: 'var(--cor-borda)',
                color: 'var(--cor-texto)',
              }}
            >
              <WhatsApp className="w-5 h-5" />
            </a>
          </div>
        </div>

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
              {erro && <p className="text-xs mt-2" style={{ color: '#ef4444' }}>{erro}</p>}
            </>
          )}
          <p className="mt-8 text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
            © {new Date().getFullYear()} Lume. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer