import { formatarMoeda } from '../../../utils/formatar'
import { Carrinho, Check } from '../../ui/Icones'

function AreaCompra({ precoTotal, tamanho, cor, esgotado, noCarrinho, avisoId, arquivo, onComprar }) {
  return (
    <>
      <div className="mt-6 flex gap-3">
        <button
          onClick={() => {
            if (esgotado) return
            onComprar(arquivo)
          }}
          disabled={esgotado}
          className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl text-white text-lg font-medium cursor-pointer transition-all duration-300 hover:scale-[1.02] border-none disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'var(--cor-laranja)', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
        >
          {noCarrinho ? <Check className="w-5 h-5" /> : <Carrinho className="w-5 h-5" />}
          {noCarrinho ? `Adicionado — ${formatarMoeda(precoTotal)}` : 'Comprar agora'}
        </button>
      </div>

      {noCarrinho && avisoId > 0 && (
        <p
          className="mt-3 text-sm py-2 px-4 text-center rounded-lg"
          style={{ background: 'var(--cor-fundo-cartao)', color: 'var(--cor-laranja-claro)' }}
        >
          Item adicionado ao carrinho! Tamanho {tamanho} · Cor {cor}
        </p>
      )}
    </>
  )
}

export default AreaCompra
