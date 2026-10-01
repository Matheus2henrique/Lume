import { formatarMoeda } from '../../../utils/formatar'

function RodapeDados({ subtotal, totalItens, freteEscolhido, total, carregando, onVoltar }) {
  return (
    <div
      className="px-6 py-5 border-t flex flex-col gap-3"
      style={{ borderColor: 'var(--cor-borda)', background: 'var(--cor-fundo-suave)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: 'var(--cor-texto-suave)' }}>
          Subtotal ({totalItens} {totalItens === 1 ? 'item' : 'itens'})
        </span>
        <span className="text-sm font-semibold" style={{ color: 'var(--cor-texto)' }}>
          {formatarMoeda(subtotal)}
        </span>
      </div>
      {freteEscolhido && (
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: 'var(--cor-texto-suave)' }}>
            Frete ({freteEscolhido.servico})
          </span>
          <span className="text-sm font-semibold" style={{ color: 'var(--cor-texto)' }}>
            {formatarMoeda(freteEscolhido.valor)}
          </span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: 'var(--cor-texto-suave)' }}>
          Total
        </span>
        <span className="text-2xl font-bold" style={{ color: 'var(--cor-texto)' }}>
          {formatarMoeda(total)}
        </span>
      </div>
      <button
        type="submit"
        disabled={carregando}
        className="w-full py-4 rounded-full text-white text-base font-medium cursor-pointer transition-all duration-300 hover:scale-[1.02] border-none disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: 'var(--cor-primaria)', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
      >
        {carregando ? 'Processando…' : `Confirmar pagamento`}
      </button>
      <button
        type="button"
        onClick={onVoltar}
        className="w-full py-3 rounded-full cursor-pointer text-sm font-medium transition-all duration-300 border-none"
        style={{ background: 'transparent', color: 'var(--cor-texto)', border: '1px solid var(--cor-borda)' }}
      >
        Voltar ao carrinho
      </button>
    </div>
  )
}

export default RodapeDados
