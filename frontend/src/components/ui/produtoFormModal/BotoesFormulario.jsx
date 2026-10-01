function BotoesFormulario({ produto, onFechar, onPedirExclusao }) {
  return (
    <div className="flex gap-3 mt-2">
      <button
        type="submit"
        className="flex-1 py-3 rounded-full border-none cursor-pointer text-white font-medium text-base transition-transform hover:scale-105"
        style={{ background: 'var(--cor-laranja)' }}
      >
        {produto ? 'Salvar Alterações' : 'Criar Produto'}
      </button>
      {produto && (
        <button
          type="button"
          onClick={onPedirExclusao}
          className="py-3 px-4 rounded-full border-none cursor-pointer text-white text-base"
          style={{ background: 'var(--cor-perigo)' }}
        >
          Excluir
        </button>
      )}
      <button
        type="button"
        onClick={onFechar}
        className="py-3 px-6 rounded-full bg-transparent cursor-pointer text-base"
        style={{ color: 'var(--cor-texto-suave)', border: '1px solid var(--cor-borda)' }}
      >
        Cancelar
      </button>
    </div>
  )
}

export default BotoesFormulario
