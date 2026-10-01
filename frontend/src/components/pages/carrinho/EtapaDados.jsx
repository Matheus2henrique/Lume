import CamposCliente from './CamposCliente'
import BlocoFrete from './BlocoFrete'
import BlocoPagamento from './BlocoPagamento'
import RodapeDados from './RodapeDados'

function EtapaDados({
  onSubmit,
  cliente,
  setCliente,
  freteLigado,
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
  metodo,
  setMetodo,
  gateway,
  erro,
  carregando,
  subtotal,
  totalItens,
  total,
  onVoltar,
}) {
  return (
    <form onSubmit={onSubmit} className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
        <CamposCliente cliente={cliente} setCliente={setCliente} />

        {freteLigado && (
          <BlocoFrete
            cep={cep}
            alterarCep={alterarCep}
            cepCompleto={cepCompleto}
            carregandoFrete={carregandoFrete}
            cotarFrete={cotarFrete}
            digitosCep={digitosCep}
            itens={itens}
            erroFrete={erroFrete}
            opcoes={opcoes}
            freteEscolhido={freteEscolhido}
            setFreteEscolhido={setFreteEscolhido}
          />
        )}

        <BlocoPagamento metodo={metodo} setMetodo={setMetodo} gateway={gateway} />

        {erro && (
          <p className="text-sm" style={{ color: 'var(--cor-perigo)' }}>
            {erro}
          </p>
        )}
      </div>

      <RodapeDados
        subtotal={subtotal}
        totalItens={totalItens}
        freteEscolhido={freteEscolhido}
        total={total}
        carregando={carregando}
        onVoltar={onVoltar}
      />
    </form>
  )
}

export default EtapaDados
