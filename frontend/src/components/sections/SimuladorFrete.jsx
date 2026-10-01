import { useState, useEffect } from 'react'
import { api } from '../../api'
import { carregarCarrinho } from '../../utils/carrinho'
import { formatarMoeda } from '../../utils/formatar'

/** "01310100" → "01310-100" (máscara enquanto digita). */
function mascararCep(valor) {
  const digitos = String(valor).replace(/\D/g, '').slice(0, 8)
  return digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos
}

const estiloCampo = {
  borderColor: 'var(--cor-borda)',
  color: 'var(--cor-texto)',
  background: 'var(--cor-fundo)',
}

const estiloRotulo = { color: 'var(--cor-texto-suave)' }

function rotulo(texto, htmlFor) {
  return (
    <label htmlFor={htmlFor} className="text-sm mb-1 block" style={estiloRotulo}>
      {texto}
    </label>
  )
}

/**
 * Seção pública da home: a pessoa informa onde mora e vê quanto custa a
 * entrega antes de comprar. Só o CEP do cliente é enviado — o CEP da loja
 * (ME_CEP_ORIGEM) mora no backend e nunca aparece na resposta.
 *
 * Quando há itens no carrinho a cotação usa esses itens; sem carrinho o
 * backend cota a encomenda padrão. Sem token configurado a mesma rota
 * responde "indisponível" e a seção não quebra o resto da página.
 */
function SimuladorFrete() {
  const [cep, setCep] = useState('')
  const [endereco, setEndereco] = useState({ rua: '', numero: '', bairro: '', cidade: '', uf: '' })
  const [opcoes, setOpcoes] = useState([])
  const [pacote, setPacote] = useState('padrao')
  const [totalItens, setTotalItens] = useState(0)
  const [calculando, setCalculando] = useState(false)
  const [erro, setErro] = useState('')
  const [cotado, setCotado] = useState(false)

  const digitosCep = cep.replace(/\D/g, '')
  const cepCompleto = digitosCep.length === 8

  // ViaCEP preenche rua/bairro/cidade/UF quando o CEP fica completo
  // (melhor esforço: se falhar, a pessoa digita à mão).
  useEffect(() => {
    if (!cepCompleto) return undefined
    let cancelado = false
    fetch(`https://viacep.com.br/ws/${digitosCep}/json/`)
      .then((r) => r.json())
      .then((dados) => {
        if (cancelado || dados?.erro) return
        setEndereco((atual) => ({
          ...atual,
          rua: dados.logradouro || atual.rua,
          bairro: dados.bairro || atual.bairro,
          cidade: dados.localidade || atual.cidade,
          uf: dados.uf || atual.uf,
        }))
      })
      .catch(() => {})
    return () => {
      cancelado = true
    }
  }, [cepCompleto, digitosCep])

  /** CEP novo limpa o endereço anterior e a cotação daquele destino. */
  function alterarCep(valor) {
    const formatado = mascararCep(valor)
    setCep(formatado)
    const completo = formatado.replace(/\D/g, '').length === 8
    if (completo) {
      setEndereco((atual) => ({ ...atual, rua: '', bairro: '', cidade: '', uf: '' }))
      setOpcoes([])
      setCotado(false)
      setErro('')
    }
  }

  async function calcular(evento) {
    evento.preventDefault()
    setErro('')
    setOpcoes([])
    setCotado(false)

    if (!cepCompleto) {
      setErro('Informe um CEP com 8 dígitos.')
      return
    }

    setCalculando(true)
    try {
      const carrinho = carregarCarrinho()
      const itens = carrinho.map((item) => ({
        produtoId: item.produto.id,
        quantidade: item.quantidade,
      }))
      const quantidade = carrinho.reduce((soma, item) => soma + item.quantidade, 0)

      let resposta
      try {
        resposta = await api.calcularFrete({
          cep: digitosCep,
          ...(itens.length ? { itens } : {}),
        })
      } catch (falha) {
        // Produto removido da loja: refaz a simulação na encomenda padrão.
        if (!itens.length || !String(falha.message).includes('Produto')) throw falha
        resposta = await api.calcularFrete({ cep: digitosCep })
      }

      if (!resposta.ativo) {
        setErro('O cálculo de frete está indisponível no momento. Tente novamente mais tarde.')
        return
      }

      const lista = resposta.opcoes || []
      if (lista.length === 0) {
        setErro('Não encontramos opções de frete para este CEP.')
        return
      }

      setPacote(resposta.pacote || 'padrao')
      setTotalItens(quantidade)
      setOpcoes(lista)
      setCotado(true)
    } catch (falha) {
      setErro(falha.message)
    } finally {
      setCalculando(false)
    }
  }

  return (
    <div
      className="mt-[100px] rounded-3xl p-6 md:p-10"
      style={{ background: 'var(--cor-fundo-cartao)', border: '1px solid var(--cor-borda)' }}
    >
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        <div>
          <span
            className="inline-block px-4 py-1.5 rounded-full text-sm font-medium"
            style={{ background: 'var(--cor-laranja)', color: 'var(--cor-texto)' }}
          >
            Entrega para todo o Brasil
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl font-[Georgia,serif]" style={{ color: 'var(--cor-texto)' }}>
            Simule o valor do frete
          </h2>
          <p className="mt-2" style={{ color: 'var(--cor-texto-suave)' }}>
            Preencha os dados de onde você mora e veja quanto custa levar a Lume até a sua casa.
          </p>

          <form className="mt-6 flex flex-col gap-3" onSubmit={calcular}>
            <div className="flex gap-3">
              <div className="flex-1">
                {rotulo('CEP*', 'simulador-cep')}
                <input
                  id="simulador-cep"
                  type="text"
                  inputMode="numeric"
                  maxLength={9}
                  placeholder="00000-000"
                  value={cep}
                  onChange={(e) => alterarCep(e.target.value)}
                  className="w-full border rounded-lg px-4 py-3 text-sm outline-none transition-colors focus:shadow-[0_0_0_2px_var(--cor-laranja)]"
                  style={estiloCampo}
                />
              </div>
              <div className="w-24">
                {rotulo('Número', 'simulador-numero')}
                <input
                  id="simulador-numero"
                  type="text"
                  maxLength={6}
                  placeholder="123"
                  value={endereco.numero}
                  onChange={(e) => setEndereco((atual) => ({ ...atual, numero: e.target.value }))}
                  className="w-full border rounded-lg px-4 py-3 text-sm outline-none transition-colors focus:shadow-[0_0_0_2px_var(--cor-laranja)]"
                  style={estiloCampo}
                />
              </div>
            </div>

            <div>
              {rotulo('Endereço', 'simulador-rua')}
              <input
                id="simulador-rua"
                type="text"
                maxLength={80}
                placeholder="Rua, avenida…"
                value={endereco.rua}
                onChange={(e) => setEndereco((atual) => ({ ...atual, rua: e.target.value }))}
                className="w-full border rounded-lg px-4 py-3 text-sm outline-none transition-colors focus:shadow-[0_0_0_2px_var(--cor-laranja)]"
                style={estiloCampo}
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                {rotulo('Bairro', 'simulador-bairro')}
                <input
                  id="simulador-bairro"
                  type="text"
                  maxLength={60}
                  value={endereco.bairro}
                  onChange={(e) => setEndereco((atual) => ({ ...atual, bairro: e.target.value }))}
                  className="w-full border rounded-lg px-4 py-3 text-sm outline-none transition-colors focus:shadow-[0_0_0_2px_var(--cor-laranja)]"
                  style={estiloCampo}
                />
              </div>
              <div className="flex-1">
                {rotulo('Cidade', 'simulador-cidade')}
                <input
                  id="simulador-cidade"
                  type="text"
                  maxLength={60}
                  value={endereco.cidade}
                  onChange={(e) => setEndereco((atual) => ({ ...atual, cidade: e.target.value }))}
                  className="w-full border rounded-lg px-4 py-3 text-sm outline-none transition-colors focus:shadow-[0_0_0_2px_var(--cor-laranja)]"
                  style={estiloCampo}
                />
              </div>
              <div className="w-20">
                {rotulo('UF', 'simulador-uf')}
                <input
                  id="simulador-uf"
                  type="text"
                  maxLength={2}
                  placeholder="UF"
                  value={endereco.uf}
                  onChange={(e) =>
                    setEndereco((atual) => ({ ...atual, uf: e.target.value.toUpperCase() }))
                  }
                  className="w-full border rounded-lg px-4 py-3 text-sm uppercase outline-none transition-colors focus:shadow-[0_0_0_2px_var(--cor-laranja)]"
                  style={estiloCampo}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={calculando}
              className="self-start px-8 py-3.5 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: 'var(--cor-laranja)', color: 'var(--cor-texto)' }}
            >
              {calculando ? 'Calculando…' : 'Calcular frete'}
            </button>
          </form>

          {erro && (
            <p className="text-sm mt-3" style={{ color: 'var(--cor-perigo)' }}>
              {erro}
            </p>
          )}

          <p className="text-xs mt-3" style={{ color: 'var(--cor-texto-suave)' }}>
            O cálculo usa o CEP de entrega. O valor final do frete é confirmado no carrinho antes
            do pagamento.
          </p>
        </div>

        <div
          className="rounded-2xl p-5 flex flex-col"
          style={{ background: 'var(--cor-fundo)', border: '1px solid var(--cor-borda)' }}
        >
          {calculando ? (
            <p className="text-sm py-10 text-center" style={{ color: 'var(--cor-texto-suave)' }}>
              Calculando as opções de entrega…
            </p>
          ) : cotado ? (
            <>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
                    Entrega para
                  </p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--cor-texto)' }}>
                    {[endereco.rua, endereco.numero, endereco.bairro, endereco.cidade, endereco.uf]
                      .filter(Boolean)
                      .join(', ') || cep}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
                    CEP {cep}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
                    A partir de
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--cor-laranja)' }}>
                    {formatarMoeda(opcoes[0].valor)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                {opcoes.map((op, indice) => (
                  <div
                    key={op.servicoId}
                    className="flex items-center gap-3 rounded-xl px-3 py-3"
                    style={{
                      background: 'var(--cor-fundo-cartao)',
                      border:
                        indice === 0
                          ? '1px solid var(--cor-laranja)'
                          : '1px solid var(--cor-borda)',
                    }}
                  >
                    {op.logo ? (
                      <img
                        src={op.logo}
                        alt=""
                        className="w-8 h-8 rounded object-contain shrink-0"
                        loading="lazy"
                      />
                    ) : (
                      <span
                        className="w-8 h-8 rounded shrink-0 flex items-center justify-center text-xs font-bold"
                        style={{ background: 'var(--cor-borda)', color: 'var(--cor-texto)' }}
                      >
                        {(op.transportadora || op.servico || '?').slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold truncate" style={{ color: 'var(--cor-texto)' }}>
                        {op.servico}
                      </span>
                      <span className="block text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
                        {op.transportadora && `${op.transportadora} · `}
                        {op.prazoMin > 0 || op.prazoMax > 0
                          ? `chega em ${op.prazoMin} a ${op.prazoMax} dias`
                          : 'prazo não informado'}
                        {indice === 0 && ' · mais barato'}
                      </span>
                    </span>
                    <span className="text-sm font-bold whitespace-nowrap" style={{ color: 'var(--cor-laranja)' }}>
                      {formatarMoeda(op.valor)}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-xs mt-4" style={{ color: 'var(--cor-texto-suave)' }}>
                {pacote === 'carrinho'
                  ? `Estimativa para ${totalItens} ${totalItens === 1 ? 'item' : 'itens'} do seu carrinho.`
                  : 'Estimativa para uma encomenda padrão da loja.'}
              </p>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-10">
              <svg
                viewBox="0 0 24 24"
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
                style={{ color: 'var(--cor-laranja)' }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                />
              </svg>
              <p className="text-sm max-w-[260px]" style={{ color: 'var(--cor-texto-suave)' }}>
                Informe o seu CEP e calcule para ver as opções de entrega e o valor de cada uma.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SimuladorFrete
