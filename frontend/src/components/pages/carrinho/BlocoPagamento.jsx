function BlocoPagamento({ metodo, setMetodo, gateway }) {
  return (
    <>
      <p className="text-sm font-medium mt-2" style={{ color: 'var(--cor-texto)' }}>
        Pagamento
      </p>
      <div className="flex gap-2">
        {[
          { id: 'cartao', nome: 'Cartão' },
          { id: 'pix', nome: 'Pix' },
        ].map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMetodo(m.id)}
            className={`flex-1 py-3 rounded-full cursor-pointer border-none text-sm font-medium transition-all ${
              metodo === m.id ? 'text-white' : ''
            }`}
            style={
              metodo === m.id
                ? { background: 'var(--cor-primaria)' }
                : { background: 'var(--cor-fundo-suave)', color: 'var(--cor-texto)' }
            }
          >
            {m.nome}
          </button>
        ))}
      </div>

      <p
        className="text-xs leading-relaxed rounded-lg px-3 py-2"
        style={{ background: 'var(--cor-fundo-suave)', color: 'var(--cor-texto-suave)' }}
      >
        {gateway
          ? 'Você será levado ao Mercado Pago para pagar com Pix, cartão ou boleto. Nunca digite os dados do seu cartão aqui — eles são informados apenas no ambiente seguro do Mercado Pago.'
          : 'Pagamento simulado para demonstração: nenhum valor será cobrado.'}
      </p>
    </>
  )
}

export default BlocoPagamento
