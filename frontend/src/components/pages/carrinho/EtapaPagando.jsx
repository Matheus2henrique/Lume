function EtapaPagando({ onFechar }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
      <span className="w-20 h-20 rounded-full flex items-center justify-center text-white text-4xl animate-pulse" style={{ background: 'var(--cor-primaria)' }}>
        🧾
      </span>
      <h3 className="text-lg font-semibold" style={{ color: 'var(--cor-texto)' }}>
        Redirecionando para o Mercado Pago…
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--cor-texto-suave)' }}>
        Você será levado ao ambiente seguro do Mercado Pago para concluir o pagamento com Pix, cartão ou boleto.
      </p>
      <button
        onClick={onFechar}
        className="mt-2 px-6 py-3 rounded-full text-sm font-medium cursor-pointer transition-all duration-300 hover:scale-105 border-none"
        style={{ background: 'var(--cor-fundo-suave)', color: 'var(--cor-texto)' }}
      >
        Fechar
      </button>
    </div>
  )
}

export default EtapaPagando
