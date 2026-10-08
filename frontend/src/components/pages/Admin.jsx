import { useState, useEffect } from 'react'
import { api } from '../../api'
import ProdutoFormModal from '../ui/ProdutoFormModal'
import NichoFormModal from '../ui/NichoFormModal'
import NichosSidebar from './admin/NichosSidebar'
import ListaProdutos from './admin/ListaProdutos'
import AbaPedidos from './admin/AbaPedidos'
import AbaSubpastas from './admin/AbaSubpastas'
import SubpastaFormModal from './admin/SubpastaFormModal'
import ConfirmarExclusao from './admin/ConfirmarExclusao'

function Admin({ onVoltar, produtos, nichos, subcategorias = {}, onSalvarNichos, onExcluirNichos, onSalvarSubcategoria, onExcluirSubcategoria, onSalvarProduto, onExcluirProduto }) {
  const [filtroNichos, setFiltroNichos] = useState('todos')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [produtoEditando, setProdutoEditando] = useState(null)
  const [confirmarExcluir, setConfirmarExcluir] = useState(null)
  const [nichoEditando, setNichoEditando] = useState(null)
  // null = formulário de subpasta fechado; { subpasta, nichoPadrao } = aberto.
  const [formSubpasta, setFormSubpasta] = useState(null)
  const [aba, setAba] = useState('produtos') // produtos | pedidos | subpastas
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

  function abrirNovoProduto() {
    setProdutoEditando(null)
    setMostrarForm(true)
  }

  function abrirProdutoEditando(produto) {
    setProdutoEditando(produto)
    setMostrarForm(true)
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
          {[{ id: 'produtos', nome: 'Produtos' }, { id: 'subpastas', nome: 'Subpastas' }, { id: 'pedidos', nome: 'Pedidos' }].map((t) => (
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
          <NichosSidebar
            nichos={nichos}
            produtos={produtos}
            filtroNichos={filtroNichos}
            onFiltrar={setFiltroNichos}
            onNovo={() => setNichoEditando('novo')}
            onEditar={setNichoEditando}
            onExcluir={onExcluirNichos}
          />

          <ListaProdutos
            produtosFiltrados={produtosFiltrados}
            nichos={nichos}
            onNovoProduto={abrirNovoProduto}
            onEditarProduto={abrirProdutoEditando}
            onExcluirProduto={setConfirmarExcluir}
          />
        </div>
        ) : aba === 'pedidos' ? (
        <AbaPedidos
          pedidos={pedidos}
          carregandoPedidos={carregandoPedidos}
          erroPedidos={erroPedidos}
          statusSalvando={statusSalvando}
          onAtualizar={carregarPedidos}
          onStatus={handleStatus}
        />
        ) : (
        <AbaSubpastas
          nichos={nichos}
          produtos={produtos}
          subcategorias={subcategorias}
          onNovo={(nichoId = null) => setFormSubpasta({ subpasta: null, nichoPadrao: nichoId })}
          onEditar={(subpasta) => setFormSubpasta({ subpasta, nichoPadrao: null })}
        />
        )}
      </div>

      {mostrarForm && (
        <ProdutoFormModal
          produto={produtoEditando}
          nichos={nichos}
          subcategorias={subcategorias}
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
        <ConfirmarExclusao
          onConfirmar={() => { onExcluirProduto(confirmarExcluir); setConfirmarExcluir(null) }}
          onCancelar={() => setConfirmarExcluir(null)}
        />
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

      {formSubpasta !== null && (
        <SubpastaFormModal
          subpasta={formSubpasta.subpasta}
          nichoPadrao={formSubpasta.nichoPadrao}
          nichos={nichos}
          onSalvar={(dados) => {
            onSalvarSubcategoria(dados)
            setFormSubpasta(null)
          }}
          onFechar={() => setFormSubpasta(null)}
          onExcluir={(id) => {
            onExcluirSubcategoria(id)
            setFormSubpasta(null)
          }}
        />
      )}
    </section>
  )
}

export default Admin
