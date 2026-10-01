import { formatarMoeda } from '../../../utils/formatar'
import { chaveItem } from '../../../utils/carrinho'
import { hexDaCor, textoOpcoes } from '../../../utils/opcoesProduto'

function ItemCarrinho({ item, onRemover, onAlterar, onRemoverPersonalizacao }) {
  const p = item.produto
  const chave = chaveItem(item)
  const estoque = Number(p.estoque)
  const noMaximo = Number.isFinite(estoque) && item.quantidade >= estoque

  return (
    <div
      className="flex gap-4 rounded-2xl p-3"
      style={{ background: 'var(--cor-fundo-suave)', border: '1px solid var(--cor-borda)' }}
    >
      <div
        className="w-20 h-20 rounded-xl overflow-hidden shrink-0"
        style={{ background: 'var(--cor-fundo-cartao)' }}
      >
        {p.imagem ? (
          <img src={p.imagem} alt={p.nome} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-xl"
            style={{ color: 'var(--cor-texto-suave)' }}
            aria-hidden="true"
          >
            🎁
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold leading-snug" style={{ color: 'var(--cor-texto)' }}>
            {p.nome}
          </h3>
          <button
            onClick={() => onRemover(chave)}
            className="bg-transparent border-none cursor-pointer text-xs hover:underline shrink-0 flex items-center gap-1.5"
            style={{ color: 'var(--cor-perigo)' }}
            aria-label={`Remover ${p.nome}`}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
            </svg>
            Remover
          </button>
        </div>

        {item.opcoes && (
          <p className="mt-1 flex items-center gap-2 text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
            {item.opcoes.cor && (
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ background: hexDaCor(item.opcoes.cor), border: '1px solid var(--cor-borda)' }}
              />
            )}
            {textoOpcoes(item.opcoes)}
          </p>
        )}

        <div className="mt-2 flex items-center justify-between gap-3">
          <div
            className="flex items-center gap-3 rounded-full px-3 py-1"
            style={{ background: 'var(--cor-fundo-cartao)', border: '1px solid var(--cor-borda)' }}
          >
            <button
              onClick={() => onAlterar(chave, -1)}
              className="w-6 h-6 rounded-full cursor-pointer border-none text-base font-bold flex items-center justify-center"
              style={{ background: 'var(--cor-primaria-suave)', color: 'var(--cor-primaria)' }}
              aria-label="Diminuir quantidade"
            >
              −
            </button>
            <span className="text-sm font-semibold w-5 text-center" style={{ color: 'var(--cor-texto)' }}>
              {item.quantidade}
            </span>
            <button
              onClick={() => onAlterar(chave, 1)}
              disabled={noMaximo}
              className="w-6 h-6 rounded-full border-none text-base font-bold flex items-center justify-center disabled:cursor-not-allowed"
              style={{
                background: 'var(--cor-primaria-suave)',
                color: 'var(--cor-primaria)',
                opacity: noMaximo ? 0.45 : 1,
                cursor: noMaximo ? 'not-allowed' : 'pointer',
              }}
              aria-label="Aumentar quantidade"
            >
              +
            </button>
          </div>
          <p className="text-sm font-bold whitespace-nowrap" style={{ color: 'var(--cor-primaria)' }}>
            {formatarMoeda(p.preco * item.quantidade)}
          </p>
        </div>

        {noMaximo && (
          <p className="mt-2 text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
            Máximo disponível: {estoque} unidade{estoque === 1 ? '' : 's'}
          </p>
        )}

        {item.personalizacao && (
          <p
            className="mt-2 text-xs flex items-center gap-2 rounded-lg px-2 py-1"
            style={{ background: 'var(--cor-fundo-cartao)', color: 'var(--cor-primaria)' }}
          >
            <span className="truncate">
              📎 {item.personalizacao.nome}
            </span>
            <button
              type="button"
              onClick={() => onRemoverPersonalizacao?.(chave)}
              className="bg-transparent border-none cursor-pointer text-xs underline shrink-0"
              style={{ color: 'var(--cor-perigo)' }}
            >
              remover
            </button>
          </p>
        )}
      </div>
    </div>
  )
}

export default ItemCarrinho
