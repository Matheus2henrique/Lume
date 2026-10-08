import { generos as generosPadrao } from '../../data/produtos'
import FooterColunas from './footer/FooterColunas'
import FooterContato from './footer/FooterContato'
import FooterNewsletter from './footer/FooterNewsletter'

function Footer({ onHome, onSelecionarGenero, onIrParaDestaques, onPrivacidade, onTrocas, onFaq, nichos }) {
  const generos = nichos?.length ? nichos : generosPadrao

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
              <img src={`${import.meta.env.BASE_URL}nome.jpeg`} alt="logo" className="h-9 w-9 rounded-full object-cover mx-0.5" />
            </span>
          </button>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--cor-texto-suave)' }}>
            Para quem vive dentro dos livros. Decorações e colecionáveis.
          </p>
        </div>

        <FooterColunas
          generos={generos}
          onSelecionarGenero={onSelecionarGenero}
          onIrParaDestaques={onIrParaDestaques}
          onPrivacidade={onPrivacidade}
          onTrocas={onTrocas}
          onFaq={onFaq}
        />

        <FooterContato />

        <FooterNewsletter />
      </div>
    </footer>
  )
}

export default Footer
