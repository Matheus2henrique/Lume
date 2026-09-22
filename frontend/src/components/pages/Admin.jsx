import { useState } from 'react'
import { formatarMoeda } from '../../utils/formatar'
import ProdutoFormModal from '../ui/ProdutoFormModal'

function Admin({ onVoltar, produtos, nichos, onSalvarNichos, onExcluirNichos, onSalvarProduto, onExcluirProduto }) {
  const [filtroNichos, setFiltroNichos] = useState('todos')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [produtoEditando, setProdutoEditando] = useState(null)
  const [confirmarExcluir, setConfirmarExcluir] = useState(null)
  const [novoNichosNome, setNovoNichosNome] = useState('')
  const [mostrarFormNichos, setMostrarFormNichos] = useState(false)
  const [editandoNichos, setEditandoNichos] = useState(null)
  const [nichosEditNome, setNichosEditNome] = useState('')

  function handleCriarNichos(e) {
    e.preventDefault()
    if (!novoNichosNome.trim()) return
    const id = novoNichosNome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    if (nichos.some((n) => n.id === id)) return
    onSalvarNichos({ id, nome: novoNichosNome.trim(), tagline: '', descricao: '', imagem: '' })
    setNovoNichosNome('')
    setMostrarFormNichos(false)
  }

  function handleSalvarNichosEditado(e) {
    e.preventDefault()
    if (!nichosEditNome.trim() || !editandoNichos) return
    onSalvarNichos({ ...editandoNichos, nome: nichosEditNome.trim() })
    setEditandoNichos(null)
    setNichosEditNome('')
  }

  const produtosFiltrados = filtroNichos === 'todos' ? produtos : produtos.filter((p) => p.genero === filtroNichos)

  return (
    <section className="py-[40px] px-4 md:px-8 min-h-screen" style={{ background: 'var(--cor-fundo)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-[Georgia,serif] mb-1" style={{ color: 'var(--cor-texto)' }}>
              Painel Admin
            </h1>
            <p className="text-sm" style={{ color: 'var(--cor-texto-suave)' }}>
              Gerencie produtos e nichos da loja
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
                  onClick={() => setMostrarFormNichos(true)}
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
                  Todos ({produtos.length})
                </button>
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
                        onClick={() => { setEditandoNichos(n); setNichosEditNome(n.nome) }}
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

            {mostrarFormNichos && (
              <div
                className="rounded-2xl p-5 mb-6"
                style={{ background: 'var(--cor-fundo-cartao)', border: '1px solid var(--cor-laranja)' }}
              >
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--cor-texto)' }}>
                  Novo Nicho
                </h3>
                <form onSubmit={handleCriarNichos} className="flex flex-col gap-3">
                  <input
                    type="text"
                    placeholder="Nome do nicho"
                    value={novoNichosNome}
                    onChange={(e) => setNovoNichosNome(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ borderColor: 'var(--cor-borda)', color: 'var(--cor-texto)', background: 'var(--cor-fundo)' }}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-lg border-none cursor-pointer text-sm text-white font-medium"
                      style={{ background: 'var(--cor-laranja)' }}
                    >
                      Criar
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMostrarFormNichos(false); setNovoNichosNome('') }}
                      className="flex-1 py-2 rounded-lg border-none cursor-pointer text-sm bg-transparent"
                      style={{ color: 'var(--cor-texto-suave)', border: '1px solid var(--cor-borda)' }}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {editandoNichos && (
              <div
                className="rounded-2xl p-5 mb-6"
                style={{ background: 'var(--cor-fundo-cartao)', border: '1px solid var(--cor-laranja)' }}
              >
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--cor-texto)' }}>
                  Editar Nicho
                </h3>
                <form onSubmit={handleSalvarNichosEditado} className="flex flex-col gap-3">
                  <input
                    type="text"
                    value={nichosEditNome}
                    onChange={(e) => setNichosEditNome(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ borderColor: 'var(--cor-borda)', color: 'var(--cor-texto)', background: 'var(--cor-fundo)' }}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-lg border-none cursor-pointer text-sm text-white font-medium"
                      style={{ background: 'var(--cor-laranja)' }}
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditandoNichos(null); setNichosEditNome('') }}
                      className="flex-1 py-2 rounded-lg border-none cursor-pointer text-sm bg-transparent"
                      style={{ color: 'var(--cor-texto-suave)', border: '1px solid var(--cor-borda)' }}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}
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
                          style={{ background: 'var(--cor-primaria)' }}
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
    </section>
  )
}

export default Admin
