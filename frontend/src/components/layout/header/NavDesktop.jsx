import MegaMenuNicho from './MegaMenuNicho'
import { subcategorias } from '../../../data/subcategorias'

function NavDesktop({
  generos,
  generoId,
  onSelecionarGenero,
  nichoAtivo,
  onAbrirNicho,
  onAdiarFechamento,
}) {
  return (
    <nav className="hidden lg:block">
      <ul className="flex gap-[30px] list-none items-center">
        {generos.map((genero, indice) => {
          // Sem subpasta não existe painel: só o clique, que vai direto pra URL.
          const subs = subcategorias[genero.id] || []

          return (
            <li
              key={genero.id}
              className="relative"
              onMouseEnter={() => subs.length > 0 && onAbrirNicho(genero.id)}
              onMouseLeave={onAdiarFechamento}
            >
              <button
                onClick={() => onSelecionarGenero(genero.id)}
                className={`bg-transparent border-none cursor-pointer text-base transition-colors ${
                  generoId === genero.id ? 'font-semibold' : ''
                }`}
                style={{
                  color:
                    generoId === genero.id || nichoAtivo === genero.id
                      ? 'var(--cor-primaria)'
                      : 'var(--cor-texto)',
                }}
              >
                {genero.nome}
              </button>

              {subs.length > 0 && nichoAtivo === genero.id && (
                <MegaMenuNicho
                  genero={genero}
                  onAbrirNicho={onAbrirNicho}
                  onAdiarFechamento={onAdiarFechamento}
                  onEscolherSubpasta={(id, sub) => onSelecionarGenero(id, sub)}
                  alinharDireita={generos.length > 2 && indice >= generos.length - 2}
                />
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default NavDesktop
