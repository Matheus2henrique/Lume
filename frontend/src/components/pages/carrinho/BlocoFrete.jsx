import { formatarMoeda } from '../../../utils/formatar'
import { estiloInput } from './estilos'

function BlocoFrete({
  cep,
  alterarCep,
  cepCompleto,
  carregandoFrete,
  cotarFrete,
  digitosCep,
  itens,
  erroFrete,
  opcoes,
  freteEscolhido,
  setFreteEscolhido,
}) {
  return (
    <>
      <p className="text-sm font-medium mt-2" style={{ color: 'var(--cor-texto)' }}>
        Entrega
      </p>
      <div className="flex gap-2">
        <div className="flex-1 text-left">
          <label className="text-sm mb-1 block" style={{ color: 'var(--cor-texto-suave)' }}>
            CEP*
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={9}
            placeholder="00000-000"
            value={cep}
            onChange={(e) => alterarCep(e.target.value)}
            className="w-full border rounded-lg px-4 py-3 text-base outline-none transition-colors"
            style={estiloInput}
          />
        </div>
        <button
          type="button"
          onClick={() => cotarFrete(digitosCep, itens)}
          disabled={!cepCompleto || carregandoFrete}
          className="px-4 self-end py-3 rounded-full cursor-pointer border-none text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: 'var(--cor-fundo-suave)', color: 'var(--cor-texto)', border: '1px solid var(--cor-borda)' }}
        >
          {carregandoFrete ? '…' : 'Calcular'}
        </button>
      </div>

      {carregandoFrete && (
        <p className="text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
          Calculando o frete…
        </p>
      )}
      {erroFrete && (
        <p className="text-xs" style={{ color: 'var(--cor-perigo)' }}>
          {erroFrete}
        </p>
      )}

      {!carregandoFrete && !erroFrete && cepCompleto && opcoes.length === 0 && (
        <p className="text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
          Nenhuma opção de frete para este CEP.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {opcoes.map((op) => {
          const selecionada = freteEscolhido?.servicoId === op.servicoId
          return (
            <label
              key={op.servicoId}
              className="flex items-center gap-3 rounded-xl px-3 py-3 cursor-pointer"
              style={{
                background: selecionada ? 'var(--cor-primaria-suave)' : 'var(--cor-fundo-suave)',
                border: `1px solid ${selecionada ? 'var(--cor-primaria)' : 'var(--cor-borda)'}`,
              }}
            >
              <input
                type="radio"
                name="frete"
                className="accent-[var(--cor-laranja)] w-4 h-4 shrink-0"
                checked={selecionada}
                onChange={() => setFreteEscolhido(op)}
              />
              <span className="flex-1 min-w-0 text-left">
                <span className="block text-sm font-semibold truncate" style={{ color: 'var(--cor-texto)' }}>
                  {op.servico}
                </span>
                <span className="block text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
                  {op.transportadora && `${op.transportadora} · `}
                  {op.prazoMin > 0 || op.prazoMax > 0
                    ? `chega em ${op.prazoMin} a ${op.prazoMax} dias`
                    : 'prazo não informado'}
                </span>
              </span>
              <span className="text-sm font-bold whitespace-nowrap" style={{ color: 'var(--cor-primaria)' }}>
                {formatarMoeda(op.valor)}
              </span>
            </label>
          )
        })}
      </div>
    </>
  )
}

export default BlocoFrete
