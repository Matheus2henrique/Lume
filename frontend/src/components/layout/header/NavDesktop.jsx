import MegaMenuNicho from './MegaMenuNicho'

function NavDesktop({
  generos,
  generoId,
  onSelecionarGenero,
  nichoAtivo,
  onAbrirNicho,
  onAdiarFechamento,
  produtos,
  onEscolherProduto,
}) {
  return (
    <nav className="hidden lg:block">
      <ul className="flex gap-[30px] list-none items-center">
        {generos.map((genero) => (
          <li
            key={genero.id}
            className="relative"
            onMouseEnter={() => onAbrirNicho(genero.id)}
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

            {nichoAtivo === genero.id && (
              <MegaMenuNicho
                genero={genero}
                produtos={produtos}
                onAbrirNicho={onAbrirNicho}
                onAdiarFechamento={onAdiarFechamento}
                onEscolherProduto={onEscolherProduto}
              />
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default NavDesktop
