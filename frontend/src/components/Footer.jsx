import { useState } from 'react'
import { generos } from '../data/produtos'
import { Check } from './Icones'

function Footer({ onHome, onSelecionarGenero, onAssinar, onIrParaDestaques }) {
  const [email, setEmail] = useState('')
  const [inscrito, setInscrito] = useState(false)

  function handleNewsletter(e) {
    e.preventDefault()
    if (email.trim() && email.includes('@')) {
      setInscrito(true)
      setEmail('')
    }
  }

  return (
    <footer
      className="mt-auto"
      style={{ background: 'var(--cor-fundo-suave)' }}
    >
      <div className="max-w-[1400px] mx-auto px-6 py-8 grid grid-cols-2 lg:grid-cols-6 gap-8 lg:divide-x divide-[var(--cor-borda)]">
        <div className="order-1 col-span-2 lg:col-span-1">
          <button onClick={onHome} className="border-none bg-transparent cursor-pointer flex items-center">
            <span
              className="flex items-center leading-none"
              style={{ fontFamily: 'Cinzel, Georgia, serif', color: 'var(--cor-texto)' }}
            >
              <span className="font-bold" style={{ fontSize: '36px' }}>L</span>
              <img src={`${import.meta.env.BASE_URL}logo.jpeg`} alt="" className="h-9 w-9 rounded-full object-cover mx-0.5" />
              <span className="font-bold" style={{ fontSize: '36px' }}>cus</span>
            </span>
          </button>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--cor-texto-suave)' }}>
            Para quem vive dentro dos livros. Decorações, colecionáveis e o Clube Locus.
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
                  className="bg-transparent border-none cursor-pointer text-sm "
                  style={{ color: 'var(--cor-texto-suave)' }}
                >
                  {genero.nome}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="order-4 lg:order-3">
          <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: 'var(--cor-texto)' }}>
            Ajuda
          </h4>
          <ul className="flex flex-col gap-3 list-none">
            {['Perguntas frequentes', 'Trocas e devoluções', 'Política de privacidade'].map((ajuda) => (
              <li key={ajuda}>
                <a href="#" className="text-sm " style={{ color: 'var(--cor-texto-suave)' }}>
                  {ajuda}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: 'var(--cor-texto)' }}>
            Navegue
          </h4>
          <ul className="flex flex-col gap-3 list-none">
            <li>
              <button
                onClick={onAssinar}
                className="bg-transparent border-none cursor-pointer text-sm text-left"
                style={{ color: 'var(--cor-texto-suave)' }}
              >
                Clube Locus
              </button>
            </li>
            <li>
              <button onClick={onIrParaDestaques} className="bg-transparent border-none cursor-pointer text-sm text-left" style={{ color: 'var(--cor-texto-suave)' }}>
                Produtos em Destaque
              </button>
            </li>
          </ul>
        </div>

        <div className="order-3 lg:order-4">
          <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: 'var(--cor-texto)' }}>
            Ajuda
          </h4>
          <ul className="flex flex-col gap-3 list-none">
            {['Perguntas frequentes', 'Trocas e devoluções', 'Política de privacidade'].map((ajuda) => (
              <li key={ajuda}>
                <a href="#" className="text-sm " style={{ color: 'var(--cor-texto-suave)' }}>
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
            <li>ola@clube-locus.com</li>
            <li>(11) 99999-9999</li>
            <li>Atendemos todo o Brasil</li>
          </ul>
        </div>

        <div className="order-6 col-span-2 lg:col-span-1">
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
                style={{ background: 'var(--cor-primaria)' }}
              >
                Enviar
              </button>
            </form>
          )}
          <p className="mt-8 text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
            © {new Date().getFullYear()} Locus — Clube de leitores. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer