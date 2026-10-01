import { SetaEsquerda } from '../../ui/Icones'

function BarraSuperior({ genero, onVoltar, admin, produto, onEditarProduto }) {
  return (
    <div className="flex items-center justify-between">
      <button
        onClick={onVoltar}
        className="flex items-center gap-2 text-base font-medium cursor-pointer hover:underline border-none bg-transparent"
        style={{ color: 'var(--cor-laranja-claro)' }}
      >
        <SetaEsquerda className="w-5 h-5" />
        Voltar para {genero?.nome}
      </button>
      {admin && onEditarProduto && (
        <button
          onClick={() => onEditarProduto(produto)}
          className="flex items-center gap-2 px-4 py-2 rounded-full border-none cursor-pointer text-sm font-medium transition-all duration-300 hover:scale-105"
          style={{ background: 'var(--cor-laranja)', color: '#fff' }}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Editar produto
        </button>
      )}
    </div>
  )
}

export default BarraSuperior
