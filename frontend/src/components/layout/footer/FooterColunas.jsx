function FooterColunas({ generos, onSelecionarGenero, onIrParaDestaques, onPrivacidade, onTrocas, onFaq }) {
  return (
    <>
      <div className="order-2">
        <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: 'var(--cor-texto)' }}>
          Categorias
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
          <li>
            <button
              onClick={onFaq}
              className="bg-transparent border-none cursor-pointer text-sm p-0"
              style={{ color: 'var(--cor-texto-suave)' }}
            >
              Perguntas frequentes
            </button>
          </li>
          <li>
            <button
              onClick={onTrocas}
              className="bg-transparent border-none cursor-pointer text-sm p-0"
              style={{ color: 'var(--cor-texto-suave)' }}
            >
              Trocas e devoluções
            </button>
          </li>
          <li>
            <button
              onClick={onPrivacidade}
              className="bg-transparent border-none cursor-pointer text-sm p-0"
              style={{ color: 'var(--cor-texto-suave)' }}
            >
              Política de privacidade
            </button>
          </li>
        </ul>
      </div>
    </>
  )
}

export default FooterColunas
