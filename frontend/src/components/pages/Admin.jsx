import { useState, useEffect } from 'react'
import { api } from '../../api'
import { formatarMoeda } from '../../utils/formatar'
import ProdutoFormModal from '../ui/ProdutoFormModal'
import NichoFormModal from '../ui/NichoFormModal'

const STATUS_PEDIDO = [
  { id: 'novo', nome: 'Recebido' },
  { id: 'pendente', nome: 'Aguardando pagamento' },
  { id: 'pago', nome: 'Pago' },
  { id: 'enviado', nome: 'Enviado' },
  { id: 'entregue', nome: 'Entregue' },
  { id: 'cancelado', nome: 'Cancelado' },
]

function Admin({ onVoltar, produtos, nichos, onSalvarNichos, onExcluirNichos, onSalvarProduto, onExcluirProduto }) {
  const [filtroNichos, setFiltroNichos] = useState('todos')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [produtoEditando, setProdutoEditando] = useState(null)
  const [confirmarExcluir, setConfirmarExcluir] = useState(null)
  const [nichoEditando, setNichoEditando] = useState(null)
  const [aba, setAba] = useState('produtos') // produtos | pedidos
  const [pedidos, setPedidos] = useState(null) // null = ainda não carregou
  const [carregandoPedidos, setCarregandoPedidos] = useState(false)
  const [erroPedidos, setErroPedidos] = useState('')
  const [statusSalvando, setStatusSalvando] = useState(null)

  const produtosFiltrados = filtroNichos === 'todos' ? produtos : produtos.filter((p) => p.genero === filtroNichos)

  // Carga da aba de pedidos: os set-states acontecem só depois do await
  // (setState síncrono dentro de efeito causaria render em cascata).
  useEffect(() => {
    if (aba !== 'pedidos') return undefined
    let ativo = true
    api.pedidos
      .listarTodos()
      .then((dados) => {
        if (ativo) setPedidos(dados)
      })
      .catch((err) => {
        if (ativo) {
          setErroPedidos(err.message)
          setPedidos((atual) => atual ?? [])
        }
      })
    return () => {
      ativo = false
    }
  }, [aba])

  async function carregarPedidos() {
    setCarregandoPedidos(true)
    setErroPedidos('')
    try {
      setPedidos(await api.pedidos.listarTodos())
    } catch (err) {
      setErroPedidos(err.message)
      setPedidos((atual) => atual ?? [])
    } finally {
      setCarregandoPedidos(false)
    }
  }

  async function handleStatus(pedido, novoStatus) {
    if (novoStatus === pedido.status) return
    setStatusSalvando(pedido.id)
    setErroPedidos('')
    try {
      await api.pedidos.alterarStatus(pedido.id, novoStatus)
      setPedidos((atual) =>
        atual.map((p) => (p.id === pedido.id ? { ...p, status: novoStatus } : p))
      )
    } catch (err) {
      setErroPedidos(err.message)
      carregarPedidos() // re-sincroniza com o que ficou no servidor
    } finally {
      setStatusSalvando(null)
    }
  }

  return (
    <section className="py-[40px] px-4 md:px-8 min-h-screen" style={{ background: 'var(--cor-fundo)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-[Georgia,serif] mb-1" style={{ color: 'var(--cor-texto)' }}>
              Painel Admin
            </h1>
            <p className="text-sm" style={{ color: 'var(--cor-texto-suave)' }}>
              Gerencie produtos, nichos e pedidos da loja
            </p>
          </div>
          <button
            onClick={onVoltar}
            className="border-none px-5 py-2 rounded-full bg-transparent cursor-pointer text-sm transition-all duration-300 hover:underline"
            style={{ color: 'var(--cor-texto-suave)', border: '1px solid var(--cor-borda)' }}
          >
            Voltar ao site
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          {[{ id: 'produtos', nome: 'Produtos' }, { id: 'pedidos', nome: 'Pedidos' }].map((t) => (
            <button
              key={t.id}
              onClick={() => setAba(t.id)}
              className="px-5 py-2 rounded-full border-none cursor-pointer text-sm font-medium transition-colors"
              style={
                aba === t.id
                  ? { background: 'var(--cor-laranja)', color: '#fff' }
                  : {
                      background: 'var(--cor-fundo-cartao)',
                      color: 'var(--cor-texto-suave)',
                      border: '1px solid var(--cor-borda)',
                    }
              }
            >
              {t.nome}
            </button>
          ))}
        </div>

        {aba === 'produtos' ? (
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-72 shrink-0">
            <div
              className="rounded-2xl p-5 mb-6"
              style={{ background: 'var(--cor-fundo-cartao)', border: '1px solid var(--cor-borda)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold" style={{ color: 'var(--cor-texto)' }}>
                  Nichos
                </h2>
                <button
                  onClick={() => setNichoEditando('novo')}
                  className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer border-none text-white text-xl font-bold transition-transform hover:scale-110"
                  style={{ background: 'var(--cor-laranja)' }}
                  title="Criar novo nicho"
                >
                  +
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setFiltroNichos('todos')}
                  className="text-left px-3 py-2 rounded-lg border-none cursor-pointer text-sm transition-colors"
                  style={{
                    background: filtroNichos === 'todos' ? 'var(--cor-laranja)' : 'transparent',
                    color: filtroNichos === 'todos' ? '#fff' : 'var(--cor-texto-suave)',
                  }}
                >
                  Todos ({nichos.length})
                </button>
                <div
                  className="text-left px-3 py-2 rounded-lg text-sm"
                  style={{ color: 'var(--cor-texto-suave)' }}
                >
                  Produtos ({produtos.length})
                </div>
                {nichos.map((n) => {
                  const count = produtos.filter((p) => p.genero === n.id).length
                  return (
                    <div key={n.id} className="flex items-center gap-1">
                      <button
                        onClick={() => setFiltroNichos(n.id)}
                        className="flex-1 text-left px-3 py-2 rounded-lg border-none cursor-pointer text-sm transition-colors"
                        style={{
                          background: filtroNichos === n.id ? 'var(--cor-laranja)' : 'transparent',
                          color: filtroNichos === n.id ? '#fff' : 'var(--cor-texto-suave)',
                        }}
                      >
                        {n.nome} ({count})
                      </button>
                      <button
                        onClick={() => setNichoEditando(n)}
                        className="w-7 h-7 rounded flex items-center justify-center border-none cursor-pointer bg-transparent transition-colors hover:bg-[rgba(255,255,255,0.1)]"
                        style={{ color: 'var(--cor-texto-suave)' }}
                        title="Editar nicho"
                      >
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onExcluirNichos(n.id)}
                        className="w-7 h-7 rounded flex items-center justify-center border-none cursor-pointer bg-transparent transition-colors hover:bg-[rgba(239,68,68,0.2)]"
                        style={{ color: 'var(--cor-perigo)' }}
                        title="Excluir nicho"
                      >
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold" style={{ color: 'var(--cor-texto)' }}>
                Produtos ({produtosFiltrados.length})
              </h2>
              <button
                onClick={() => { setProdutoEditando(null); setMostrarForm(true) }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full border-none cursor-pointer text-white text-sm font-medium transition-transform hover:scale-105"
                style={{ background: 'var(--cor-laranja)' }}
              >
                <span className="text-lg leading-none">+</span> Novo Produto
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {produtosFiltrados.map((produto) => {
                const nicho = nichos.find((n) => n.id === produto.genero)
                return (
                  <div
                    key={produto.id}
                    className="rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                    style={{ background: 'var(--cor-fundo-cartao)', border: '1px solid var(--cor-borda)' }}
                  >
                    <div className="relative">
                      <img
                        src={produto.imagem}
                        alt={produto.nome}
                        className="w-full h-[160px] object-cover"
                      />
                      {nicho && (
                        <span
                          className="absolute top-2 left-2 text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: 'var(--cor-badge-primaria)', color: '#fff' }}
                        >
                          {nicho.nome}
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-semibold mb-2 leading-snug" style={{ color: 'var(--cor-texto)' }}>
                        {produto.nome}
                      </h3>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-base font-bold" style={{ color: 'var(--cor-laranja-claro)' }}>
                          {formatarMoeda(produto.preco)}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
                          {produto.estoque} em estoque
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setProdutoEditando(produto); setMostrarForm(true) }}
                          className="flex-1 py-2 rounded-lg border-none cursor-pointer text-xs font-medium text-white transition-opacity hover:opacity-80"
                          style={{ background: 'var(--cor-laranja)' }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setConfirmarExcluir(produto.id)}
                          className="py-2 px-3 rounded-lg border-none cursor-pointer text-xs font-medium transition-opacity hover:opacity-80"
                          style={{ background: 'var(--cor-perigo)', color: '#fff' }}
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {produtosFiltrados.length === 0 && (
              <div className="text-center py-16">
                <p className="text-lg" style={{ color: 'var(--cor-texto-suave)' }}>
                  Nenhum produto encontrado neste nicho.
                </p>
              </div>
            )}
          </div>
        </div>
        ) : (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold" style={{ color: 'var(--cor-texto)' }}>
              Pedidos ({pedidos?.length ?? 0})
            </h2>
            <button
              onClick={carregarPedidos}
              disabled={carregandoPedidos}
              className="px-4 py-2 rounded-full border-none cursor-pointer text-sm transition-all hover:scale-105 disabled:opacity-60"
              style={{ background: 'var(--cor-fundo-cartao)', color: 'var(--cor-texto)', border: '1px solid var(--cor-borda)' }}
            >
              {carregandoPedidos ? 'Atualizando…' : 'Atualizar'}
            </button>
          </div>

          {erroPedidos && (
            <p className="text-sm mb-4 rounded-lg px-3 py-2" style={{ color: 'var(--cor-perigo)', background: 'var(--cor-fundo-cartao)' }}>
              {erroPedidos}
            </p>
          )}

          {pedidos === null ? (
            <p className="text-center py-16" style={{ color: 'var(--cor-texto-suave)' }}>
              Carregando pedidos…
            </p>
          ) : carregandoPedidos ? (
            <p className="text-center py-16" style={{ color: 'var(--cor-texto-suave)' }}>
              Atualizando pedidos…
            </p>
          ) : pedidos.length === 0 && !erroPedidos ? (
            <div className="text-center py-16">
              <p className="text-lg" style={{ color: 'var(--cor-texto-suave)' }}>
                Nenhum pedido ainda.
              </p>
            </div>
          ) : (
            pedidos.map((pedido) => (
              <div
                key={pedido.id}
                className="rounded-xl p-4 mb-4"
                style={{ background: 'var(--cor-fundo-cartao)', border: '1px solid var(--cor-borda)' }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--cor-texto)' }}>
                      Pedido #{pedido.id}
                      <span className="ml-2 text-xs font-normal" style={{ color: 'var(--cor-texto-suave)' }}>
                        {pedido.criado_em ? new Date(pedido.criado_em).toLocaleString('pt-BR') : ''}
                      </span>
                    </p>
                    <p className="text-sm" style={{ color: 'var(--cor-texto-suave)' }}>
                      {pedido.cliente_nome || '—'} · {pedido.cliente_email || ''}
                    </p>
                    {pedido.cliente_endereco && (
                      <p className="text-xs mt-1" style={{ color: 'var(--cor-texto-suave)' }}>
                        {pedido.cliente_endereco}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="font-bold" style={{ color: 'var(--cor-laranja-claro)' }}>
                      {formatarMoeda(pedido.total)}
                    </p>
                    <select
                      value={pedido.status}
                      disabled={statusSalvando === pedido.id}
                      onChange={(e) => handleStatus(pedido, e.target.value)}
                      className="rounded-lg px-3 py-1.5 text-sm cursor-pointer disabled:opacity-60"
                      style={{
                        background: 'var(--cor-fundo-suave)',
                        color: 'var(--cor-texto)',
                        border: '1px solid var(--cor-borda)',
                      }}
                      aria-label={`Status do pedido ${pedido.id}`}
                    >
                      {STATUS_PEDIDO.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <ul className="mt-3 pt-3 border-t flex flex-col gap-1" style={{ borderColor: 'var(--cor-borda)' }}>
                  {(Array.isArray(pedido.itens) ? pedido.itens : []).map((item, i) => (
                    <li
                      key={`${item.produtoId}-${i}`}
                      className="text-sm flex flex-wrap justify-between gap-2"
                      style={{ color: 'var(--cor-texto)' }}
                    >
                      <span>
                        {item.nome} × {item.quantidade}
                      </span>
                      <span className="flex items-center gap-3">
                        {item.personalizacao && (
                          <a
                            href={item.personalizacao.dados}
                            download={item.personalizacao.nome}
                            className="text-xs underline"
                            style={{ color: 'var(--cor-primaria)' }}
                            title="Baixar o arquivo de personalização"
                          >
                            📎 {item.personalizacao.nome}
                          </a>
                        )}
                        <span className="font-semibold">
                          {formatarMoeda(Number(item.preco) * Number(item.quantidade))}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>

                {pedido.pagamento && (
                  <p className="text-xs mt-2" style={{ color: 'var(--cor-texto-suave)' }}>
                    Pagamento: {pedido.pagamento.metodo || '—'} · {pedido.pagamento.status || '—'}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
        )}
      </div>

      {mostrarForm && (
        <ProdutoFormModal
          produto={produtoEditando}
          nichos={nichos}
          onSalvar={(dados) => {
            setMostrarForm(false)
            setProdutoEditando(null)
            onSalvarProduto(dados)
          }}
          onFechar={() => { setMostrarForm(false); setProdutoEditando(null) }}
          onExcluir={(id) => {
            onExcluirProduto(id)
            setConfirmarExcluir(null)
          }}
        />
      )}

      {confirmarExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div
            className="w-full max-w-sm rounded-2xl p-6 text-center"
            style={{ background: 'var(--cor-fundo-cartao)', border: '1px solid var(--cor-borda)' }}
          >
            <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)' }}>
              <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="var(--cor-perigo)" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--cor-texto)' }}>
              Excluir produto?
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--cor-texto-suave)' }}>
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { onExcluirProduto(confirmarExcluir); setConfirmarExcluir(null) }}
                className="flex-1 py-2.5 rounded-full border-none cursor-pointer text-white font-medium text-sm"
                style={{ background: 'var(--cor-perigo)' }}
              >
                Sim, excluir
              </button>
              <button
                onClick={() => setConfirmarExcluir(null)}
                className="flex-1 py-2.5 rounded-full bg-transparent cursor-pointer text-sm"
                style={{ color: 'var(--cor-texto-suave)', border: '1px solid var(--cor-borda)' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {nichoEditando !== null && (
        <NichoFormModal
          nicho={nichoEditando === 'novo' ? null : nichoEditando}
          onSalvar={(dados) => {
            onSalvarNichos(dados)
            setNichoEditando(null)
          }}
          onFechar={() => setNichoEditando(null)}
          onExcluir={(id) => {
            onExcluirNichos(id)
            setNichoEditando(null)
          }}
        />
      )}
    </section>
  )
}

export default Admin
