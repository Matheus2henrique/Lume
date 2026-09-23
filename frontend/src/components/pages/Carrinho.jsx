import { useState, useEffect } from 'react'
import { api, sessaoValida } from '../../api'
import { formatarMoeda } from '../../utils/formatar'

const estiloInput = {
  borderColor: 'var(--cor-borda)',
  color: 'var(--cor-texto)',
  background: 'var(--cor-fundo-cartao)',
}

function CarrinhoDrawer({ itens, onFechar, onRemover, onAlterar, onFinalizar, onEntrar }) {
  const [etapa, setEtapa] = useState('itens') // itens | dados | pagando | sucesso
  const [cliente, setCliente] = useState({ nome: '', email: '', telefone: '', endereco: '' })
  const [metodo, setMetodo] = useState('cartao')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [pedido, setPedido] = useState(null)
  const [gateway, setGateway] = useState(false)

  useEffect(() => {
    api.statusPagamento()
      .then((r) => setGateway(Boolean(r.gateway)))
      .catch(() => setGateway(false))
  }, [])

  const total = itens.reduce((soma, item) => soma + item.produto.preco * item.quantidade, 0)
  const totalItens = itens.reduce((soma, item) => soma + item.quantidade, 0)

  // Compra só é permitida com conta logada (sessão existente e não expirada).
  const logado = sessaoValida()

  function validarDados() {
    if (!cliente.nome.trim() || !cliente.email.trim()) {
      setErro('Informe nome e e-mail para continuar.')
      return false
    }
    return true
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
        cliente,
        pagamento: { metodo },
        itens: itens.map((item) => ({ produtoId: item.produto.id, quantidade: item.quantidade })),
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

        <div
          className="flex items-center justify-between px-6 py-5 border-b"
          style={{ borderColor: 'var(--cor-borda)' }}
        >
          <div className="flex items-center gap-3">
            <span
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: 'var(--cor-primaria-suave)', color: 'var(--cor-primaria)' }}
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                <circle cx="9" cy="21" r="1" fill="currentColor" />
                <circle cx="20" cy="21" r="1" fill="currentColor" />
              </svg>
            </span>
            <div>
              <h2 className="text-xl font-[Georgia,serif] leading-tight" style={{ color: 'var(--cor-texto)' }}>
                {etapa === 'dados' ? 'Finalizar compra' : etapa === 'sucesso' ? 'Pedido confirmado' : etapa === 'pagando' ? 'Pagamento' : 'Seu carrinho'}
              </h2>
              <p className="text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
                {etapa === 'sucesso' ? 'Pagamento aprovado' : etapa === 'pagando' ? 'Mercado Pago' : `${totalItens} ${totalItens === 1 ? 'item' : 'itens'}`}
              </p>
            </div>
          </div>
          <button
            onClick={onFechar}
            className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer border-none transition-colors"
            style={{ background: 'var(--cor-fundo-suave)', color: 'var(--cor-texto)' }}
            aria-label="Fechar carrinho"
          >
            ✕
          </button>
        </div>

        {etapa === 'pagando' ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <span className="w-20 h-20 rounded-full flex items-center justify-center text-white text-4xl animate-pulse" style={{ background: 'var(--cor-primaria)' }}>
              🧾
            </span>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--cor-texto)' }}>
              Redirecionando para o Mercado Pago…
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--cor-texto-suave)' }}>
              Você será levado ao ambiente seguro do Mercado Pago para concluir o pagamento com Pix, cartão ou boleto.
            </p>
            <button
              onClick={onFechar}
              className="mt-2 px-6 py-3 rounded-full text-sm font-medium cursor-pointer transition-all duration-300 hover:scale-105 border-none"
              style={{ background: 'var(--cor-fundo-suave)', color: 'var(--cor-texto)' }}
            >
              Fechar
            </button>
          </div>
        ) : etapa === 'sucesso' ? (
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
              onClick={onFechar}
              className="mt-2 px-6 py-3 rounded-full text-white text-sm font-medium cursor-pointer transition-transform duration-300 hover:scale-105 border-none"
              style={{ background: 'var(--cor-primaria)' }}
            >
              Continuar comprando
            </button>
          </div>
        ) : itens.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
          <span
              className="w-30 h-30 rounded-full flex items-center justify-center"
              style={{ background: 'var(--cor-primaria-suave)', color: 'var(--cor-primaria)' }}
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                <circle cx="9" cy="21" r="1" fill="currentColor" />
                <circle cx="20" cy="21" r="1" fill="currentColor" />
              </svg>
          </span>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--cor-texto)' }}>
              Seu carrinho está vazio
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--cor-texto-suave)' }}>
              Explore os universos e adicione peças incríveis para levar a magia para casa.
            </p>
            <button
              onClick={onFechar}
              className="mt-2 px-6 py-3 rounded-full text-white text-sm font-medium cursor-pointer transition-transform duration-300 hover:scale-105 border-none"
              style={{ background: 'var(--cor-primaria)' }}
            >
              Continuar comprando
            </button>
          </div>
        ) : etapa === 'dados' ? (
          <form onSubmit={handleFinalizar} className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
              <p className="text-sm font-medium" style={{ color: 'var(--cor-texto)' }}>
                Dados para entrega
              </p>
              {[
                { label: 'Nome completo', tipo: 'text', placeholder: 'Seu nome', chave: 'nome', campo: cliente },
              ].map((c) => (
                <div key={c.chave} className="text-left">
                  <label className="text-sm mb-1 block" style={{ color: 'var(--cor-texto-suave)' }}>
                    {c.label}*
                  </label>
                  <input
                    type={c.tipo}
                    placeholder={c.placeholder}
                    value={c.campo[c.chave]}
                    onChange={(e) => setCliente({ ...cliente, [c.chave]: e.target.value })}
                    required
                    className="w-full border rounded-lg px-4 py-3 text-base outline-none transition-colors"
                    style={estiloInput}
                  />
                </div>
              ))}
              {[
                { label: 'E-mail', tipo: 'email', placeholder: 'seu@email.com', chave: 'email' },
                { label: 'Telefone', tipo: 'tel', placeholder: '(11) 99999-9999', chave: 'telefone' },
                { label: 'Endereço', tipo: 'text', placeholder: 'Rua, número, bairro, cidade', chave: 'endereco' },
              ].map((c) => (
                <div key={c.chave} className="text-left">
                  <label className="text-sm mb-1 block" style={{ color: 'var(--cor-texto-suave)' }}>
                    {c.label}
                  </label>
                  <input
                    type={c.tipo}
                    placeholder={c.placeholder}
                    value={cliente[c.chave]}
                    onChange={(e) => setCliente({ ...cliente, [c.chave]: e.target.value })}
                    className="w-full border rounded-lg px-4 py-3 text-base outline-none transition-colors"
                    style={estiloInput}
                  />
                </div>
              ))}

              <p className="text-sm font-medium mt-2" style={{ color: 'var(--cor-texto)' }}>
                Pagamento
              </p>
              <div className="flex gap-2">
                {[
                  { id: 'cartao', nome: 'Cartão' },
                  { id: 'pix', nome: 'Pix' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMetodo(m.id)}
                    className={`flex-1 py-3 rounded-full cursor-pointer border-none text-sm font-medium transition-all ${
                      metodo === m.id ? 'text-white' : ''
                    }`}
                    style={
                      metodo === m.id
                        ? { background: 'var(--cor-primaria)' }
                        : { background: 'var(--cor-fundo-suave)', color: 'var(--cor-texto)' }
                    }
                  >
                    {m.nome}
                  </button>
                ))}
              </div>

              <p
                className="text-xs leading-relaxed rounded-lg px-3 py-2"
                style={{ background: 'var(--cor-fundo-suave)', color: 'var(--cor-texto-suave)' }}
              >
                {gateway
                  ? 'Você será levado ao Mercado Pago para pagar com Pix, cartão ou boleto. Nunca digite os dados do seu cartão aqui — eles são informados apenas no ambiente seguro do Mercado Pago.'
                  : 'Pagamento simulado para demonstração: nenhum valor será cobrado.'}
              </p>

              {erro && (
                <p className="text-sm" style={{ color: 'var(--cor-perigo)' }}>
                  {erro}
                </p>
              )}
            </div>

            <div
              className="px-6 py-5 border-t flex flex-col gap-3"
              style={{ borderColor: 'var(--cor-borda)', background: 'var(--cor-fundo-suave)' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--cor-texto-suave)' }}>
                  Total ({totalItens} {totalItens === 1 ? 'item' : 'itens'})
                </span>
                <span className="text-2xl font-bold" style={{ color: 'var(--cor-texto)' }}>
                  {formatarMoeda(total)}
                </span>
              </div>
              <button
                type="submit"
                disabled={carregando}
                className="w-full py-4 rounded-full text-white text-base font-medium cursor-pointer transition-all duration-300 hover:scale-[1.02] border-none disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: 'var(--cor-primaria)', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
              >
                {carregando ? 'Processando…' : `Confirmar pagamento`}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEtapa('itens')
                  setErro('')
                }}
                className="w-full py-3 rounded-full cursor-pointer text-sm font-medium transition-all duration-300 border-none"
                style={{ background: 'transparent', color: 'var(--cor-texto)', border: '1px solid var(--cor-borda)' }}
              >
                Voltar ao carrinho
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
              {itens.map((item) => {
                const p = item.produto
                return (
                  <div
                    key={p.id}
                    className="flex gap-4 rounded-2xl p-3"
                    style={{ background: 'var(--cor-fundo-suave)', border: '1px solid var(--cor-borda)' }}
                  >
                    <div
                      className="w-20 h-20 rounded-xl overflow-hidden shrink-0"
                      style={{ background: 'var(--cor-fundo-cartao)' }}
                    >
                      <img src={p.imagem} alt={p.nome} className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold leading-snug" style={{ color: 'var(--cor-texto)' }}>
                          {p.nome}
                        </h3>
                        <button
                          onClick={() => onRemover(p.id)}
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

                      <div className="mt-2 flex items-center justify-between gap-3">
                        <div
                          className="flex items-center gap-3 rounded-full px-3 py-1"
                          style={{ background: 'var(--cor-fundo-cartao)', border: '1px solid var(--cor-borda)' }}
                        >
                          <button
                            onClick={() => onAlterar(p.id, -1)}
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
                            onClick={() => onAlterar(p.id, 1)}
                            className="w-6 h-6 rounded-full cursor-pointer border-none text-base font-bold flex items-center justify-center"
                            style={{ background: 'var(--cor-primaria-suave)', color: 'var(--cor-primaria)' }}
                            aria-label="Aumentar quantidade"
                          >
                            +
                          </button>
                        </div>
                        <p className="text-sm font-bold whitespace-nowrap" style={{ color: 'var(--cor-primaria)' }}>
                          {formatarMoeda(p.preco * item.quantidade)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
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
                  {formatarMoeda(total)}
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
                onClick={() => (logado ? setEtapa('dados') : onEntrar?.())}
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
        )}
      </div>
    </div>
  )
}

export default CarrinhoDrawer