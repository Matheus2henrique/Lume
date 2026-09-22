import { formatarMoeda } from '../../utils/formatar'

function Card({ nome, imagem, preco, estoque, tipo, permiteUpload, onClick, favorito = false, onToggleFavorito, admin = false, onEditarProduto, produto }) {
  const tipoLabel = tipo === 'colecionavel' ? 'Colecionável' : 'Decoração'
  const poucoEstoque = estoque <= 5

  return (
    <div
      onClick={onClick}
      className="group rounded-[18px] overflow-hidden text-left transition-all duration-700 ease-in-out cursor-pointer hover:-translate-y-1 card-badges relative"
      style={{
        background: 'var(--cor-fundo-cartao)',
        border: '1px solid var(--cor-borda)',
        boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
      }}
    >
      {admin && onEditarProduto && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEditarProduto(produto)
          }}
          className="absolute top-3 left-3 z-20 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer border-none shadow-md transition-all duration-300 hover:scale-110"
          style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(2px)' }}
          aria-label="Editar produto"
        >
          <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="none" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      )}

      <div className="relative overflow-hidden">
        <img
          src={imagem}
          alt={nome}
          className="w-full h-[178px] object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleFavorito?.()
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer border-none shadow-md transition-all duration-300 hover:scale-110"
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
        <div className="absolute bottom-3 left-3 flex gap-2">
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full shadow"
            style={{ background: 'var(--cor-badge-primaria)', color: '#fff' }}
          >
            {tipoLabel}
          </span>
          {permiteUpload && (
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full shadow"
              style={{ background: 'var(--cor-laranja)', color: 'var(--cor-texto)' }}
            >
              Personalizável
            </span>
          )}
          {poucoEstoque && (
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full shadow"
              style={{ background: 'var(--cor-perigo)', color: '#fff' }}
            >
              Poucas unidades
            </span>
          )}
        </div>
      </div>

      <div className="p-[12px]">
        <h3 className="text-sm font-semibold leading-snug" style={{ color: 'var(--cor-texto)' }}>
          {nome}
        </h3>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-base font-bold" style={{ color: 'var(--cor-laranja-claro)' }}>
            {formatarMoeda(preco)}
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
          style={{ background: 'var(--cor-laranja)' }}
        >
          Ver detalhes
        </button>
      </div>
    </div>
  )
}

export default Card
