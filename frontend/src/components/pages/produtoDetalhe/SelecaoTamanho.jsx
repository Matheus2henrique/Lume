import { TAMANHOS } from '../../../utils/opcoesProduto'

function SelecaoTamanho({ tamanho, onSelecionar }) {
  return (
    <div className="mt-6">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium" style={{ color: 'var(--cor-texto)' }}>
          Tamanho
        </span>
        <span className="text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
          {tamanho}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {TAMANHOS.map((t) => {
          const ativo = t === tamanho
          return (
            <button
              key={t}
              type="button"
              onClick={() => onSelecionar(t)}
              aria-pressed={ativo}
              aria-label={`Tamanho ${t}`}
              className="w-11 h-11 rounded-full text-sm font-semibold cursor-pointer transition-all duration-200 hover:scale-105"
              style={{
                background: ativo ? 'var(--cor-laranja)' : 'var(--cor-fundo-cartao)',
                color: ativo ? '#fff' : 'var(--cor-texto)',
                border: `1px solid ${ativo ? 'var(--cor-laranja-claro)' : 'var(--cor-borda)'}`,
                boxShadow: ativo ? '0 6px 14px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              {t}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default SelecaoTamanho
