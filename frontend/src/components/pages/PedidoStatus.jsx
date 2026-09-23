import { useEffect, useRef, useState } from 'react'
import { api } from '../../api'
import { formatarMoeda } from '../../utils/formatar'

const ROTULO_STATUS = {
  novo: { texto: 'Recebido', cor: 'var(--cor-primaria)' },
  pendente: { texto: 'Aguardando pagamento', cor: '#b45309' },
  pago: { texto: 'Pagamento aprovado', cor: '#15803d' },
  enviado: { texto: 'Enviado', cor: '#1d4ed8' },
  entregue: { texto: 'Entregue', cor: '#15803d' },
  cancelado: { texto: 'Cancelado', cor: 'var(--cor-perigo)' },
}

/**
 * Tela de status do pedido (/Lume/pedido/:id).
 * É para onde o Mercado Pago devolve o cliente (back_urls) — consulta o
 * pedido e faz polling enquanto o pagamento estiver pendente (Pix).
 */
function PedidoStatus({ pedidoId, onVoltar, onEntrar }) {
  const [pedido, setPedido] = useState(null)
  const [erro, setErro] = useState(null) // { status, mensagem }
  const [carregando, setCarregando] = useState(true)
  const [recarregar, setRecarregar] = useState(0)
  const intervaloRef = useRef(null)

  useEffect(() => {
    let ativo = true
    let tentativas = 0

    async function consultar() {
      try {
        const dados = await api.pedidos.buscar(pedidoId)
        if (!ativo) return
        setPedido(dados)
        setErro(null)
        // Fora de "pendente" não há mais o que acompanhar → para o polling.
        if (dados.status !== 'pendente' && intervaloRef.current) {
          clearInterval(intervaloRef.current)
          intervaloRef.current = null
        }
      } catch (err) {
        if (!ativo) return
        setErro({ status: err.status, mensagem: err.message })
        // Erros que não se resolvem sozinhos (sem sessão, pedido inexistente).
        if ([401, 403, 404].includes(err.status) && intervaloRef.current) {
          clearInterval(intervaloRef.current)
          intervaloRef.current = null
        }
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    consultar()
    intervaloRef.current = setInterval(() => {
      tentativas += 1
      if (tentativas > 75) {
        // ~5 minutos: deixa de consultar (o webhook segue processando).
        clearInterval(intervaloRef.current)
        intervaloRef.current = null
        return
      }
      consultar()
    }, 4000)

    return () => {
      ativo = false
      if (intervaloRef.current) clearInterval(intervaloRef.current)
    }
  }, [pedidoId, recarregar])

  const rotulo = pedido ? ROTULO_STATUS[pedido.status] ?? { texto: pedido.status, cor: 'var(--cor-texto-suave)' } : null
  const pendente = pedido?.status === 'pendente'

  return (
    <section className="min-h-screen py-[70px] flex justify-center px-6" style={{ background: 'var(--cor-fundo)' }}>
      <div className="w-full max-w-xl">
        <h1 className="text-4xl font-[Georgia,serif] mb-2 text-center" style={{ color: 'var(--cor-texto)' }}>
          {pedido ? `Pedido #${pedido.id}` : 'Acompanhar pedido'}
        </h1>
        <p className="text-center mb-8 text-sm" style={{ color: 'var(--cor-texto-suave)' }}>
          {pendente
            ? 'Aguardando confirmação do pagamento — esta página atualiza sozinha.'
            : 'Status da sua compra na Lume.'}
        </p>

        {carregando && !pedido && !erro && (
          <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--cor-fundo-cartao)', border: '1px solid var(--cor-borda)' }}>
            <p style={{ color: 'var(--cor-texto-suave)' }}>Carregando o pedido…</p>
          </div>
        )}

        {erro && !pedido && (
          <div className="rounded-2xl p-8 text-center flex flex-col gap-4" style={{ background: 'var(--cor-fundo-cartao)', border: '1px solid var(--cor-borda)' }}>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--cor-texto)' }}>
              {erro.status === 401
                ? 'Sua sessão expirou. Entre na sua conta para acompanhar este pedido.'
                : erro.status === 403
                  ? 'Você não tem permissão para ver este pedido.'
                  : erro.status === 404
                    ? 'Pedido não encontrado.'
                    : erro.mensagem}
            </p>
            <div className="flex flex-col gap-2">
              {erro.status === 401 && (
                <button
                  onClick={onEntrar}
                  className="py-3 rounded-full border-none cursor-pointer text-white text-sm font-medium"
                  style={{ background: 'var(--cor-primaria)' }}
                >
                  Entrar na conta
                </button>
              )}
              {erro.status !== 401 && (
                <button
                  onClick={() => setRecarregar((n) => n + 1)}
                  className="py-3 rounded-full border-none cursor-pointer text-white text-sm font-medium"
                  style={{ background: 'var(--cor-primaria)' }}
                >
                  Tentar novamente
                </button>
              )}
              <button
                onClick={onVoltar}
                className="py-3 rounded-full cursor-pointer text-sm font-medium bg-transparent"
                style={{ color: 'var(--cor-texto)', border: '1px solid var(--cor-borda)' }}
              >
                Voltar ao início
              </button>
            </div>
          </div>
        )}

        {pedido && (
          <div className="rounded-2xl p-6 flex flex-col gap-5" style={{ background: 'var(--cor-fundo-cartao)', border: '1px solid var(--cor-borda)' }}>
            <div className="flex items-center justify-between gap-3">
              <span
                className="px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                style={{ background: rotulo.cor }}
              >
                {rotulo.texto}
              </span>
              <span className="text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
                {pedido.criado_em ? new Date(pedido.criado_em).toLocaleString('pt-BR') : ''}
              </span>
            </div>

            {pendente && (
              <p
                className="text-xs leading-relaxed rounded-lg px-3 py-2"
                style={{ background: 'var(--cor-fundo-suave)', color: 'var(--cor-texto-suave)' }}
              >
                {pedido.pagamento?.metodo === 'pix'
                  ? 'Pague via Pix no Mercado Pago. Assim que o pagamento cair, o status muda aqui automaticamente.'
                  : 'Assim que o pagamento for aprovado, o status desta página muda automaticamente e o estoque é reservado.'}
              </p>
            )}

            <div>
              <p className="text-xs mb-2" style={{ color: 'var(--cor-texto-suave)' }}>
                Itens
              </p>
              <ul className="flex flex-col gap-2">
                {(Array.isArray(pedido.itens) ? pedido.itens : []).map((item, i) => (
                  <li key={`${item.produtoId}-${i}`} className="text-sm" style={{ color: 'var(--cor-texto)' }}>
                    <div className="flex justify-between gap-3">
                      <span>
                        {item.nome} <span style={{ color: 'var(--cor-texto-suave)' }}>× {item.quantidade}</span>
                      </span>
                      <span className="font-semibold whitespace-nowrap">
                        {formatarMoeda(Number(item.preco) * Number(item.quantidade))}
                      </span>
                    </div>
                    {item.personalizacao && (
                      <p className="text-xs mt-1" style={{ color: 'var(--cor-primaria)' }}>
                        📎 Personalização: {item.personalizacao.nome}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="flex items-center justify-between rounded-xl px-4 py-3"
              style={{ background: 'var(--cor-fundo-suave)' }}
            >
              <span className="text-sm" style={{ color: 'var(--cor-texto-suave)' }}>
                Total
              </span>
              <span className="text-xl font-bold" style={{ color: 'var(--cor-texto)' }}>
                {formatarMoeda(pedido.total)}
              </span>
            </div>

            {pedido.cliente_endereco && (
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--cor-texto-suave)' }}>
                  Entrega
                </p>
                <p className="text-sm" style={{ color: 'var(--cor-texto)' }}>
                  {pedido.cliente_nome} — {pedido.cliente_endereco}
                </p>
              </div>
            )}

            <button
              onClick={onVoltar}
              className="py-3 rounded-full cursor-pointer text-sm font-medium bg-transparent"
              style={{ color: 'var(--cor-texto)', border: '1px solid var(--cor-borda)' }}
            >
              Continuar comprando
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

export default PedidoStatus
