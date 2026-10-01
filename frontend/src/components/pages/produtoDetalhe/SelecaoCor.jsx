import { CORES } from '../../../utils/opcoesProduto'

function SelecaoCor({ cor, onSelecionar }) {
  return (
    <div className="mt-5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium" style={{ color: 'var(--cor-texto)' }}>
          Cor
        </span>
        <span className="text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
          {cor}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        {CORES.map((c) => {
          const ativo = c.nome === cor
          return (
            <button
              key={c.nome}
              type="button"
              onClick={() => onSelecionar(c.nome)}
              aria-pressed={ativo}
              aria-label={`Cor ${c.nome}`}
              title={c.nome}
              className="w-9 h-9 rounded-full cursor-pointer transition-transform duration-200 hover:scale-110"
              style={{
                background: c.hex,
                border: `1px solid ${ativo ? 'var(--cor-laranja-claro)' : 'var(--cor-borda)'}`,
                outline: ativo ? '2px solid var(--cor-laranja-claro)' : 'none',
                outlineOffset: '2px',
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

export default SelecaoCor
