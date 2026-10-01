function Quantidade({ quantidade, produto, onAumentar, onDiminuir }) {
  return (
    <div className="mt-5 flex items-center gap-4">
      <span className="text-sm font-medium" style={{ color: 'var(--cor-texto)' }}>
        Quantidade
      </span>
      <div
        className="flex items-center gap-4 rounded-full px-4 py-2"
        style={{ border: `1px solid var(--cor-borda)`, background: 'var(--cor-fundo-cartao)' }}
      >
        <button
          onClick={onDiminuir}
          disabled={quantidade <= 1}
          className="w-7 h-7 rounded-full cursor-pointer border-none text-lg font-bold disabled:opacity-40"
          style={{ background: 'var(--cor-laranja)', color: '#fff' }}
        >
          −
        </button>
        <span className="text-lg font-semibold w-6 text-center" style={{ color: 'var(--cor-texto)' }}>
          {quantidade}
        </span>
        <button
          onClick={onAumentar}
          disabled={quantidade >= produto.estoque}
          className="w-7 h-7 rounded-full cursor-pointer border-none text-lg font-bold disabled:opacity-40"
          style={{ background: 'var(--cor-laranja)', color: '#fff' }}
        >
          +
        </button>
      </div>
      <span className="text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
        {produto.estoque} em estoque
      </span>
    </div>
  )
}

export default Quantidade
