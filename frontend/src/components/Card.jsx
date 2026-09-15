function Card({ nome, imagem, preco, estoque, tipo, permiteUpload, onClick, favorito = false, onToggleFavorito }) {
  const tipoLabel = tipo === 'colecionavel' ? 'Colecionável' : 'Decoração'
  const poucoEstoque = estoque <= 5

  return (
    <div
      onClick={onClick}
      className="group rounded-[18px] overflow-hidden text-left transition-all duration-700 ease-in-out cursor-pointer hover:-translate-y-1"
      style={{
        background: 'var(--cor-fundo-cartao)',
        border: '1px solid var(--cor-borda)',
        boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
      }}
    >
      <div className="relative overflow-hidden">
        <img
          src={imagem}
          alt={nome}
          className="w-full h-[178px] object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full shadow"
            style={{ background: 'var(--cor-primaria)', color: '#fff' }}
          >
            {tipoLabel}
          </span>
          {permiteUpload && (
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full shadow"
              style={{ background: 'var(--cor-primaria-suave)', color: 'var(--cor-primaria)' }}
            >
              Personalizável
            </span>
          )}
          {poucoEstoque && (
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full shadow"
              style={{ background: '#ef4444', color: '#fff' }}
            >
              Poucas unidades
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorito?.()
          }}
          className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer border-none shadow-md transition-all duration-300 hover:scale-110"
          style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(2px)' }}
          aria-label={favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
            {favorito ? (
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                fill="#ef4444"
              />
            ) : (
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
              />
            )}
          </svg>
        </button>
      </div>

      <div className="p-[12px]">
        <h3 className="text-sm font-semibold leading-snug" style={{ color: 'var(--cor-texto)' }}>
          {nome}
        </h3>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-base font-bold" style={{ color: 'var(--cor-primaria)' }}>
            R$ {preco.toFixed(2).replace('.', ',')}
          </p>
          <span className="text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
            {estoque} em estoque
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onClick()
          }}
          className="mt-4 w-full py-2 rounded-lg text-white cursor-pointer transition-colors duration-300 border-none"
          style={{ background: 'var(--cor-primaria)' }}
        >
          Ver detalhes
        </button>
      </div>
    </div>
  )
}

export default Card