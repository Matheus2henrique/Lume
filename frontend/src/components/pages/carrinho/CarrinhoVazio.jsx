function CarrinhoVazio({ onFechar }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
      <span
        className="w-30 h-30 rounded-full flex items-center justify-center"
        style={{ background: 'var(--cor-primaria-suave)', color: 'var(--cor-primaria)' }}
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          <circle cx="9" cy="21" r="1" fill="currentColor" />
          <circle cx="20" cy="21" r="1" fill="currentColor" />
        </svg>
      </span>
      <h3 className="text-lg font-semibold" style={{ color: 'var(--cor-texto)' }}>
        Seu carrinho está vazio
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--cor-texto-suave)' }}>
        Explore os gêneros e adicione peças incríveis para levar a magia para casa.
      </p>
      <button
        onClick={onFechar}
        className="mt-2 px-6 py-3 rounded-full text-white text-sm font-medium cursor-pointer transition-transform duration-300 hover:scale-105 border-none"
        style={{ background: 'var(--cor-primaria)' }}
      >
        Continuar comprando
      </button>
    </div>
  )
}

export default CarrinhoVazio
