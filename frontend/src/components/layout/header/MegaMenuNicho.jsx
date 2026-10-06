import { subcategorias } from '../../../data/subcategorias'

// Mega-menu de telas maiores: lista só as subpastas do nicho e cada uma leva
// direto para a página do nicho com o filtro dela. Nicho sem subpasta
// (Coleção Dinossauro e Pacotes) não abre painel: o clique no nicho já vai
// para a URL dele.
function MegaMenuNicho({ genero, onAbrirNicho, onAdiarFechamento, onEscolherSubpasta, alinharDireita = false }) {
  const subs = subcategorias[genero?.id] || []
  if (subs.length === 0) return null

  // Cascata da animação original (45ms por elemento), na ordem da tela.
  let ordem = 0
  const proximoDelay = () => `${ordem++ * 45}ms`

  return (
    <div
      onMouseEnter={() => onAbrirNicho(genero.id)}
      onMouseLeave={onAdiarFechamento}
      className={`mega-menu absolute top-full mt-3 w-max max-w-[320px] rounded-xl border shadow-xl py-2 z-50 ${
        alinharDireita ? 'right-0' : 'left-0'
      }`}
      style={{ background: 'var(--cor-fundo-cartao)', borderColor: 'var(--cor-borda)' }}
    >
      <ul className="list-none m-0 p-0 flex flex-col">
        {subs.map((sub) => (
          <li key={`sub-${sub.id}`}>
            <button
              onClick={() => onEscolherSubpasta(genero.id, sub.id)}
              className="menu-item w-full text-left px-4 py-2 text-sm truncate bg-transparent border-none cursor-pointer"
              style={{ animationDelay: proximoDelay() }}
            >
              {sub.nome}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default MegaMenuNicho
