import { formatarMoeda } from '../../../utils/formatar'

function EtapaSucesso({ pedido, onVerPedido, onFechar }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
      <span
        className="w-20 h-20 rounded-full flex items-center justify-center text-white text-4xl"
        style={{ background: 'var(--cor-primaria)' }}
      >
        ✓
      </span>
      <h3 className="text-lg font-semibold" style={{ color: 'var(--cor-texto)' }}>
        Pedido #{pedido?.id} confirmado!
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--cor-texto-suave)' }}>
        Recebemos seu pedido no valor de{' '}
        <strong style={{ color: 'var(--cor-primaria)' }}>{formatarMoeda(pedido?.total || 0)}</strong>.
        <br />
        Produzimos sob demanda e enviamos para todo o Brasil.
      </p>
      <button
        onClick={() => onVerPedido?.(pedido?.id)}
        className="mt-2 px-6 py-3 rounded-full text-white text-sm font-medium cursor-pointer transition-transform duration-300 hover:scale-105 border-none"
        style={{ background: 'var(--cor-primaria)' }}
      >
        Ver meu pedido
      </button>
      <button
        onClick={onFechar}
        className="px-6 py-3 rounded-full text-sm font-medium cursor-pointer transition-transform duration-300 hover:scale-105"
        style={{ background: 'transparent', color: 'var(--cor-texto)', border: '1px solid var(--cor-borda)' }}
      >
        Continuar comprando
      </button>
    </div>
  )
}

export default EtapaSucesso
