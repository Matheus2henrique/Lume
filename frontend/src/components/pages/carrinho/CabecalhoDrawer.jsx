function CabecalhoDrawer({ etapa, totalItens, onFechar }) {
  return (
    <div
      className="flex items-center justify-between px-6 py-5 border-b"
      style={{ borderColor: 'var(--cor-borda)' }}
    >
      <div className="flex items-center gap-3">
        <span
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: 'var(--cor-primaria-suave)', color: 'var(--cor-primaria)' }}
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            <circle cx="9" cy="21" r="1" fill="currentColor" />
            <circle cx="20" cy="21" r="1" fill="currentColor" />
          </svg>
        </span>
        <div>
          <h2 className="text-xl font-[Georgia,serif] leading-tight" style={{ color: 'var(--cor-texto)' }}>
            {etapa === 'dados' ? 'Finalizar compra' : etapa === 'sucesso' ? 'Pedido confirmado' : etapa === 'pagando' ? 'Pagamento' : 'Seu carrinho'}
          </h2>
          <p className="text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
            {etapa === 'sucesso' ? 'Pagamento aprovado' : etapa === 'pagando' ? 'Mercado Pago' : `${totalItens} ${totalItens === 1 ? 'item' : 'itens'}`}
          </p>
        </div>
      </div>
      <button
        onClick={onFechar}
        className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer border-none transition-colors"
        style={{ background: 'var(--cor-fundo-suave)', color: 'var(--cor-texto)' }}
        aria-label="Fechar carrinho"
      >
        ✕
      </button>
    </div>
  )
}

export default CabecalhoDrawer
