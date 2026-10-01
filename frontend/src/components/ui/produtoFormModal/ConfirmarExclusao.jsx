function ConfirmarExclusao({ onConfirmar, onCancelar }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div
        className="w-full max-w-sm rounded-2xl p-6 text-center"
        style={{ background: 'var(--cor-fundo-cartao)', border: '1px solid var(--cor-borda)' }}
      >
        <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)' }}>
          <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="var(--cor-perigo)" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--cor-texto)' }}>
          Excluir produto?
        </h3>
        <p className="text-sm mb-6" style={{ color: 'var(--cor-texto-suave)' }}>
          Esta ação não pode ser desfeita.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirmar}
            className="flex-1 py-2.5 rounded-full border-none cursor-pointer text-white font-medium text-sm"
            style={{ background: 'var(--cor-perigo)' }}
          >
            Sim, excluir
          </button>
          <button
            onClick={onCancelar}
            className="flex-1 py-2.5 rounded-full bg-transparent cursor-pointer text-sm"
            style={{ color: 'var(--cor-texto-suave)', border: '1px solid var(--cor-borda)' }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmarExclusao
