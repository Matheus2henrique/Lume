import { useState, useEffect, useCallback } from 'react'
import { api, sessaoValida } from '../../api'
import CabecalhoDrawer from './carrinho/CabecalhoDrawer'
import EtapaPagando from './carrinho/EtapaPagando'
import EtapaSucesso from './carrinho/EtapaSucesso'
import CarrinhoVazio from './carrinho/CarrinhoVazio'
import EtapaDados from './carrinho/EtapaDados'
import EtapaItens from './carrinho/EtapaItens'

/** "01310100" → "01310-100" (máscara enquanto digita). */
function mascararCep(valor) {
  const digitos = String(valor).replace(/\D/g, '').slice(0, 8)
  return digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos
}

function CarrinhoDrawer({ itens, onFechar, onRemover, onAlterar, onFinalizar, onEntrar, onVerPedido, onRemoverPersonalizacao }) {
  const [etapa, setEtapa] = useState('itens') // itens | dados | pagando | sucesso
  const [cliente, setCliente] = useState({ nome: '', email: '', telefone: '', endereco: '', bairro: '', cidade: '', uf: '' })
  const [metodo, setMetodo] = useState('cartao')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [pedido, setPedido] = useState(null)
  const [gateway, setGateway] = useState(false)

  // Frete (Melhor Envio) — tudo fica escondido quando a loja não configurou
  // o token: o carrinho continua funcionando exatamente como antes.
  const [freteLigado, setFreteLigado] = useState(false)
  const [cep, setCep] = useState('')
  const [opcoes, setOpcoes] = useState([])
  const [freteEscolhido, setFreteEscolhido] = useState(null)
  const [carregandoFrete, setCarregandoFrete] = useState(false)
  const [erroFrete, setErroFrete] = useState('')

  useEffect(() => {
    api.statusPagamento()
      .then((r) => setGateway(Boolean(r.gateway)))
      .catch(() => setGateway(false))
    api.statusFrete()
      .then((r) => setFreteLigado(Boolean(r.ativo)))
      .catch(() => setFreteLigado(false))
  }, [])

  const subtotal = itens.reduce((soma, item) => soma + item.produto.preco * item.quantidade, 0)
  const totalItens = itens.reduce((soma, item) => soma + item.quantidade, 0)
  const total = subtotal + (freteEscolhido?.valor ?? 0)

  // Compra só é permitida com conta logada (sessão existente e não expirada).
  const logado = sessaoValida()

  const digitosCep = cep.replace(/\D/g, '')
  const cepCompleto = digitosCep.length === 8
  // Assinatura do carrinho: trocar quantidade/remover item precisa cotar de novo.
  const assinaturaItens = itens.map((item) => `${item.produto.id}:${item.quantidade}`).join('|')

  const cotarFrete = useCallback(async (digitos, listaItens) => {
    setCarregandoFrete(true)
    setErroFrete('')
    try {
      const resposta = await api.calcularFrete({
        cep: digitos,
        itens: listaItens.map((item) => ({
          produtoId: item.produto.id,
          quantidade: item.quantidade,
        })),
      })
      if (!resposta.ativo) {
        setFreteLigado(false)
        setOpcoes([])
        setFreteEscolhido(null)
        return
      }
      const lista = resposta.opcoes || []
      setOpcoes(lista)
      // Mantém a escolha atual se ela ainda existe (outra cotação), senão
      // pega a mais barata — a lista já vem ordenada por preço.
      setFreteEscolhido((atual) => lista.find((o) => o.servicoId === atual?.servicoId) ?? lista[0] ?? null)
    } catch (err) {
      setOpcoes([])
      setFreteEscolhido(null)
      setErroFrete(err.message)
    } finally {
      setCarregandoFrete(false)
    }
  }, [])

  // Cota (com debounce) quando o CEP fica completo e sempre que o carrinho
  // muda — o total nunca pode mostrar um frete desatualizado. Só na etapa
  // de dados: trocar quantidade na lista não deve gastar cota à toa.
  // O zera-seleção acontece dentro do timeout (fora do corpo do efeito).
  useEffect(() => {
    if (!freteLigado || !cepCompleto || etapa !== 'dados') return undefined
    const timer = setTimeout(() => {
      setFreteEscolhido(null) // evita somar o frete do CEP/carrinho anterior
      cotarFrete(digitosCep, itens)
    }, 350)
    return () => clearTimeout(timer)
  }, [freteLigado, cepCompleto, digitosCep, assinaturaItens, itens, etapa, cotarFrete])

  // ViaCEP: preenche o endereço quando o CEP fica completo (melhor esforço —
  // se a consulta falhar, o cliente digita à mão).
  useEffect(() => {
    if (!cepCompleto) return
    let cancelado = false
    fetch(`https://viacep.com.br/ws/${digitosCep}/json/`)
      .then((r) => r.json())
      .then((dados) => {
        if (cancelado || dados?.erro) return
        setCliente((atual) => ({
          ...atual,
          bairro: dados.bairro || atual.bairro,
          cidade: dados.localidade || atual.cidade,
          uf: dados.uf || atual.uf,
          endereco: atual.endereco.trim()
            ? atual.endereco
            : [dados.logradouro, dados.bairro, dados.localidade, dados.uf].filter(Boolean).join(', '),
        }))
      })
      .catch(() => {})
    return () => {
      cancelado = true
    }
  }, [cepCompleto, digitosCep])

  /** Digitação do CEP: formata e limpa a cotação anterior se ficar incompleta. */
  function alterarCep(valor) {
    const formatado = mascararCep(valor)
    setCep(formatado)
    if (formatado.replace(/\D/g, '').length !== 8) {
      setOpcoes([])
      setFreteEscolhido(null)
      setErroFrete('')
    }
  }

  function validarDados() {
    if (!cliente.nome.trim() || !cliente.email.trim()) {
      setErro('Informe nome e e-mail para continuar.')
      return false
    }
    if (freteLigado) {
      if (!cepCompleto) {
        setErro('Informe o CEP com 8 dígitos para calcular o frete.')
        return false
      }
      if (!freteEscolhido) {
        setErro('Calcule e escolha uma opção de frete para continuar.')
        return false
      }
    }
    return true
  }

  function voltarAoCarrinho() {
    setEtapa('itens')
    setErro('')
  }

  function irParaDados() {
    setEtapa('dados')
  }

  async function handleFinalizar(e) {
    e.preventDefault()
    if (!logado) {
      setEtapa('itens')
      setErro('Faça login na sua conta para finalizar a compra.')
      return
    }
    if (!validarDados()) return
    setErro('')
    setCarregando(true)
    try {
      // Nunca enviamos dados de cartão: o pagamento (real) é feito pelo
      // Mercado Pago e o simulado não cobra ninguém.
      const criado = await onFinalizar({
        cliente: { ...cliente, cep: digitosCep },
        // O backend ignora o valor e REVALIDA o frete na API — aqui vai só
        // a escolha (transportadora + CEP).
        ...(freteLigado && freteEscolhido
          ? { frete: { servicoId: freteEscolhido.servicoId, cep: digitosCep } }
          : {}),
        pagamento: { metodo },
        itens: itens.map((item) => ({
          produtoId: item.produto.id,
          quantidade: item.quantidade,
          // Variação escolhida na página do produto (cor/tamanho).
          ...(item.opcoes?.cor ? { cor: item.opcoes.cor } : {}),
          ...(item.opcoes?.tamanho ? { tamanho: item.opcoes.tamanho } : {}),
          // Personalização (arquivo em base64) vai junto no pedido:
          // é assim que a loja recebe o arquivo do cliente.
          ...(item.personalizacao ? { personalizacao: item.personalizacao } : {}),
        })),
      })

      if (criado.precisaPagamento) {
        setEtapa('pagando')
        const preferencia = await api.criarPreferencia({
          pedidoId: criado.id,
          titulo: `Pedido Lume #${criado.id}`,
          cliente,
          // Convidado usa o token devolvido na criação do pedido;
          // o valor cobrado vem do banco, não daqui.
          checkoutToken: criado.checkoutToken,
        })
        window.location.href = preferencia.init_point
        return
      }

      setPedido(criado)
      setEtapa('sucesso')
    } catch (err) {
      setEtapa('dados')
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Carrinho">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onFechar} />

      <div
        className="absolute right-0 top-0 h-full w-full max-w-[430px] flex flex-col shadow-2xl animate-[slideIn_0.3s_ease-out] carrinho-drawer"
        style={{ background: 'var(--cor-fundo-cartao)' }}
      >
        <CabecalhoDrawer etapa={etapa} totalItens={totalItens} onFechar={onFechar} />

        {etapa === 'pagando' ? (
          <EtapaPagando onFechar={onFechar} />
        ) : etapa === 'sucesso' ? (
          <EtapaSucesso pedido={pedido} onVerPedido={onVerPedido} onFechar={onFechar} />
        ) : itens.length === 0 ? (
          <CarrinhoVazio onFechar={onFechar} />
        ) : etapa === 'dados' ? (
          <EtapaDados
            onSubmit={handleFinalizar}
            cliente={cliente}
            setCliente={setCliente}
            freteLigado={freteLigado}
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
            metodo={metodo}
            setMetodo={setMetodo}
            gateway={gateway}
            erro={erro}
            carregando={carregando}
            subtotal={subtotal}
            totalItens={totalItens}
            total={total}
            onVoltar={voltarAoCarrinho}
          />
        ) : (
          <EtapaItens
            itens={itens}
            onRemover={onRemover}
            onAlterar={onAlterar}
            onRemoverPersonalizacao={onRemoverPersonalizacao}
            subtotal={subtotal}
            totalItens={totalItens}
            logado={logado}
            onDados={irParaDados}
            onEntrar={onEntrar}
            onFechar={onFechar}
          />
        )}
      </div>
    </div>
  )
}

export default CarrinhoDrawer
