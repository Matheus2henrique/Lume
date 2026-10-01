import { Instagram, WhatsApp } from '../../ui/Icones'

const LINK_INSTAGRAM = 'https://www.instagram.com/3d_.lume/'
const WHATSAPP_NUMERO = '5573998663011'
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent('Olá! Vim pelo site da Lume e quero personalizar uma peça.')}`

const estiloRede = {
  background: 'var(--cor-fundo-cartao)',
  borderColor: 'var(--cor-borda)',
  color: 'var(--cor-texto)',
}

function FooterContato() {
  return (
    <div className="order-5">
      <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: 'var(--cor-texto)' }}>
        Contato
      </h4>
      <ul className="flex flex-col gap-3 text-sm list-none" style={{ color: 'var(--cor-texto-suave)' }}>
        <li>ola@lume.com</li>
        <li>(73) 99866-3011</li>
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
          style={estiloRede}
        >
          <Instagram className="w-5 h-5" />
        </a>
        <a
          href={WHATSAPP_LINK}
          aria-label="WhatsApp da Lume"
          title="WhatsApp"
          {...(WHATSAPP_LINK !== '#' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-300 hover:scale-110"
          style={estiloRede}
        >
          <WhatsApp className="w-5 h-5" />
        </a>
      </div>
    </div>
  )
}

export default FooterContato
