function CabecalhoModal({ produto, onFechar }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-[Georgia,serif]" style={{ color: 'var(--cor-texto)' }}>
        {produto ? 'Editar Produto' : 'Novo Produto'}
      </h2>
      <button
        onClick={onFechar}
        className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer bg-transparent text-lg"
        style={{ color: 'var(--cor-texto-suave)' }}
      >
        ×
      </button>
    </div>
  )
}

export default CabecalhoModal
