import { formatarMoeda } from '../../../utils/formatar'
import { chaveItem } from '../../../utils/carrinho'
import ItemCarrinho from './ItemCarrinho'

function EtapaItens({
  itens,
  onRemover,
  onAlterar,
  onRemoverPersonalizacao,
  subtotal,
  totalItens,
  logado,
  onDados,
  onEntrar,
  onFechar,
}) {
  return (
    <>
      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
        {itens.map((item) => (
          <ItemCarrinho
            key={chaveItem(item)}
            item={item}
            onRemover={onRemover}
            onAlterar={onAlterar}
            onRemoverPersonalizacao={onRemoverPersonalizacao}
          />
        ))}
      </div>

      <div
        className="px-6 py-5 border-t flex flex-col gap-4"
        style={{ borderColor: 'var(--cor-borda)', background: 'var(--cor-fundo-suave)' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: 'var(--cor-texto-suave)' }}>
            Subtotal ({totalItens} {totalItens === 1 ? 'item' : 'itens'})
          </span>
          <span className="text-2xl font-bold" style={{ color: 'var(--cor-texto)' }}>
            {formatarMoeda(subtotal)}
          </span>
        </div>
        {!logado && (
          <p
            className="text-xs leading-relaxed rounded-lg px-3 py-2 text-center"
            style={{ background: 'var(--cor-fundo-cartao)', color: 'var(--cor-laranja-claro)', border: '1px solid var(--cor-borda)' }}
          >
            Você precisa estar logado em uma conta para finalizar a compra.
          </p>
        )}
        <button
          onClick={() => (logado ? onDados() : onEntrar?.())}
          className="w-full py-4 rounded-full text-white text-base font-medium cursor-pointer transition-all duration-300 hover:scale-[1.02] border-none"
          style={{ background: 'var(--cor-primaria)', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
        >
          {logado ? 'Finalizar compra' : 'Entrar para finalizar'}
        </button>
        <button
          onClick={onFechar}
          className="w-full py-3 rounded-full cursor-pointer text-sm font-medium transition-all duration-300 border-none"
          style={{ background: 'transparent', color: 'var(--cor-texto)', border: '1px solid var(--cor-borda)' }}
        >
          Continuar comprando
        </button>
      </div>
    </>
  )
}

export default EtapaItens
