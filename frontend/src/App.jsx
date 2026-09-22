import { useState, useEffect } from 'react'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import Entrada from './components/pages/Entrada'
import Genero from './components/pages/Genero'
import ProdutoDetalhe from './components/pages/ProdutoDetalhe'
import Perfil from './components/pages/Perfil'
import Favoritos from './components/pages/Favoritos'
import CarrinhoDrawer from './components/pages/Carrinho'
import Admin from './components/pages/Admin'
import ProdutoFormModal from './components/ui/ProdutoFormModal'
import { generos as generosPadrao, produtos as produtosPadrao } from './data/produtos'
import { api, obterToken, obterUsuario } from './api'
import { normalizarProduto } from './utils/formatar'

const BASE = '/Lume'

function rotaParaURL({ generoId, pagina, produtoSelecionado, mostrarPerfil, mostrarFavoritos, mostrarAdmin }) {
  if (mostrarAdmin) return `${BASE}/admin`
  if (mostrarPerfil) return `${BASE}/login`
  if (mostrarFavoritos) return `${BASE}/favoritos`
  if (pagina === 'detalhe' && produtoSelecionado && generoId)
    return `${BASE}/${generoId}/produto/${produtoSelecionado.id}`
  if (pagina === 'genero' && generoId) return `${BASE}/${generoId}`
  return `${BASE}`
}

function URLparaEstado(pathname, produtosLista) {
  const partes = pathname.replace(BASE, '').split('/').filter(Boolean)

  if (partes[0] === 'admin') return { pagina: 'entrada', mostrarAdmin: true }
  if (partes[0] === 'login') return { pagina: 'entrada', mostrarPerfil: true }
  if (partes[0] === 'favoritos') return { pagina: 'entrada', mostrarFavoritos: true }
  if (partes[0] === 'produto') {
    const produto = produtosLista.find((p) => p.id === Number(partes[1]))
    if (produto) return { pagina: 'detalhe', generoId: produto.genero, produtoSelecionado: produto }
  }
  if (partes[0] && partes[1] === 'produto') {
    const generoId = produtosLista.some((p) => p.genero === partes[0]) ? partes[0] : null
    const produto = produtosLista.find((p) => p.id === Number(partes[2]) && p.genero === generoId)
    if (produto) return { pagina: 'detalhe', generoId, produtoSelecionado: produto }
  }
  if (partes[0]) return { pagina: 'genero', generoId: partes[0] }

  return { pagina: 'entrada', generoId: null }
}

function App() {
  const [admin, setAdmin] = useState(() => {
    const usuario = obterUsuario()
    return Boolean(usuario?.admin)
  })
  const [produtos, setProdutos] = useState(produtosPadrao)
  const [nichos, setNichos] = useState(generosPadrao)
  const [generoId, setGeneroId] = useState(null)
  const [pagina, setPagina] = useState('entrada')
  const [produtoSelecionado, setProdutoSelecionado] = useState(null)
  const [mostrarPerfil, setMostrarPerfil] = useState(false)
  const [mostrarFavoritos, setMostrarFavoritos] = useState(false)
  const [mostrarAdmin, setMostrarAdmin] = useState(false)
  const [favoritos, setFavoritos] = useState([])
  const [carrinho, setCarrinho] = useState([])
  const [mostrarCarrinho, setMostrarCarrinho] = useState(false)
  const [produtoEditando, setProdutoEditando] = useState(null)
  const [mostrarFormProduto, setMostrarFormProduto] = useState(false)
  const [sucesso, setSucesso] = useState('')

  const genero = nichos.find((g) => g.id === generoId)

  useEffect(() => {
    api.produtos.listar()
      .then((lista) => setProdutos(lista))
      .catch(() => {})
    api.generos.listar()
      .then((lista) => { if (lista.length > 0) setNichos(lista) })
      .catch(() => {})
  }, [])

  function mostrarMensagem(msg) {
    setSucesso(msg)
    setTimeout(() => setSucesso(''), 3000)
  }

  function navegar(estado) {
    const proximo = { ...estado }
    setGeneroId(proximo.generoId ?? null)
    setPagina(proximo.pagina ?? 'entrada')
    setProdutoSelecionado(proximo.produtoSelecionado ?? null)
    setMostrarPerfil(Boolean(proximo.mostrarPerfil))
    setMostrarFavoritos(Boolean(proximo.mostrarFavoritos))
    setMostrarAdmin(Boolean(proximo.mostrarAdmin))
    window.scrollTo({ top: 0, behavior: 'smooth' })
    window.history.pushState(null, '', rotaParaURL(proximo))
  }

  useEffect(() => {
    function sincronizar() {
      const estado = URLparaEstado(window.location.pathname, produtos)
      setGeneroId(estado.generoId ?? null)
      setPagina(estado.pagina ?? 'entrada')
      setProdutoSelecionado(estado.produtoSelecionado ?? null)
      setMostrarPerfil(Boolean(estado.mostrarPerfil))
      setMostrarFavoritos(Boolean(estado.mostrarFavoritos))
      setMostrarAdmin(Boolean(estado.mostrarAdmin))
    }
    sincronizar()
    window.addEventListener('popstate', sincronizar)
    return () => window.removeEventListener('popstate', sincronizar)
  }, [produtos])

  useEffect(() => {
    if (!obterToken()) return
    api.favoritos
      .listar()
      .then((lista) => setFavoritos(lista.map(normalizarProduto)))
      .catch(() => {})
  }, [])

  function handleSelecionarGenero(id) {
    navegar({ generoId: id, pagina: 'genero' })
  }

  function handleVoltarHome() {
    navegar({ generoId: null, pagina: 'entrada' })
  }

  function handleSelecionarProduto(produto) {
    navegar({ generoId: produto.genero, pagina: 'detalhe', produtoSelecionado: produto })
  }

  function handleMostrarPerfil() {
    navegar({ pagina: 'entrada', mostrarPerfil: true })
  }

  function handleMostrarFavoritos() {
    navegar({ pagina: 'entrada', mostrarFavoritos: true })
  }

  function handleVoltarFavoritos() {
    navegar({ pagina: 'entrada' })
  }

  function handleAdminLogin() {
    setAdmin(true)
  }

  function handleAdminLogout() {
    setAdmin(false)
  }

  function toggleFavorito(produto) {
    const jaFavorito = favoritos.some((item) => item.id === produto.id)
    const aplicar = (atual) =>
      jaFavorito ? atual.filter((item) => item.id !== produto.id) : [...atual, produto]

    setFavoritos(aplicar)
    if (!obterToken()) return

    const promessa = jaFavorito
      ? api.favoritos.remover(produto.id)
      : api.favoritos.adicionar(produto.id)
    promessa.catch(() => setFavoritos(aplicar))
  }

  function handleVoltarDoPerfil() {
    navegar({ pagina: 'entrada' })
  }

  function handleMostrarAdmin() {
    navegar({ pagina: 'entrada', mostrarAdmin: true })
  }

  function handleVoltarDoAdmin() {
    navegar({ pagina: 'entrada' })
  }

  function voltarParaGenero() {
    navegar({ generoId, pagina: 'genero' })
  }

  function handleEditarProduto(produto) {
    setProdutoEditando(produto)
    setMostrarFormProduto(true)
  }

  async function handleSalvarProduto(dados) {
    try {
      const corpo = {
        nome: dados.nome,
        genero: dados.genero,
        tipo: dados.tipo,
        preco: dados.preco,
        estoque: dados.estoque,
        permite_upload: dados.permiteUpload ?? dados.permite_upload,
        descricao: dados.descricao,
        imagem: dados.imagem || dados.imagemUrl?.trim() || '',
      }
      if (dados.id) {
        const atualizado = await api.produtos.atualizar(dados.id, corpo)
        setProdutos((atual) => atual.map((p) => (p.id === dados.id ? atualizado : p)))
        mostrarMensagem('Produto atualizado com sucesso!')
      } else {
        const criado = await api.produtos.criar(corpo)
        setProdutos((atual) => [...atual, criado])
        mostrarMensagem('Produto criado com sucesso!')
      }
      setMostrarFormProduto(false)
      setProdutoEditando(null)
    } catch (err) {
      mostrarMensagem(err.message || 'Erro ao salvar produto.')
    }
  }

  async function handleExcluirProduto(id) {
    try {
      await api.produtos.excluir(id)
      setProdutos((atual) => atual.filter((p) => p.id !== id))
      setMostrarFormProduto(false)
      setProdutoEditando(null)
      mostrarMensagem('Produto excluído!')
    } catch (err) {
      mostrarMensagem(err.message || 'Erro ao excluir produto.')
    }
  }

  async function handleSalvarNichos(dados) {
    try {
      if (dados.id && nichos.some((n) => n.id === dados.id)) {
        const atualizado = await api.generos.atualizar(dados.id, dados)
        setNichos((atual) => atual.map((n) => (n.id === dados.id ? atualizado : n)))
        mostrarMensagem('Nichos atualizado!')
      } else {
        const criado = await api.generos.criar(dados)
        setNichos((atual) => [...atual, criado])
        mostrarMensagem('Nichos criado!')
      }
    } catch (err) {
      mostrarMensagem(err.message || 'Erro ao salvar nicho.')
    }
  }

  async function handleExcluirNichos(id) {
    try {
      await api.generos.excluir(id)
      setNichos((atual) => atual.filter((n) => n.id !== id))
      setProdutos((atual) => atual.map((p) => (p.genero === id ? { ...p, genero: '' } : p)))
      mostrarMensagem('Nichos excluído!')
    } catch (err) {
      mostrarMensagem(err.message || 'Erro ao excluir nicho.')
    }
  }

  function handleAdicionarAoCarrinho(produto, quantidade = 1) {
    setCarrinho((atual) => {
      const existente = atual.find((item) => item.produto.id === produto.id)
      if (existente) {
        return atual.map((item) =>
          item.produto.id === produto.id
            ? { ...item, quantidade: item.quantidade + quantidade }
            : item
        )
      }
      return [...atual, { produto, quantidade }]
    })
    setMostrarCarrinho(true)
  }

  function handleRemoverDoCarrinho(id) {
    setCarrinho((atual) => atual.filter((item) => item.produto.id !== id))
  }

  function handleAlterarQuantidade(id, delta) {
    setCarrinho((atual) =>
      atual
        .map((item) =>
          item.produto.id === id
            ? { ...item, quantidade: item.quantidade + delta }
            : item
        )
        .filter((item) => item.quantidade > 0)
    )
  }

  function handleFecharCarrinho() {
    setMostrarCarrinho(false)
  }

  async function handleFinalizar(dados) {
    const pedido = await api.criarPedido(dados)
    setCarrinho([])
    return pedido
  }

  function handleIrParaDestaques() {
    navegar({ generoId: null, pagina: 'entrada' })
    setTimeout(() => {
      document.getElementById('destaques')?.scrollIntoView({ behavior: 'smooth' })
    }, 60)
  }

  const totalCarrinho = carrinho.reduce((soma, item) => soma + item.quantidade, 0)

  return (
    <div className="w-full min-h-screen flex flex-col pt-[64px] md:pt-[90px]" style={{ background: 'var(--cor-fundo)' }}>
      <Header
        generoId={generoId}
        onSelecionarGenero={handleSelecionarGenero}
        onHome={handleVoltarHome}
        onMostrarPerfil={handleMostrarPerfil}
        totalCarrinho={totalCarrinho}
        onMostrarCarrinho={() => setMostrarCarrinho(true)}
        totalFavoritos={favoritos.length}
        onMostrarFavoritos={handleMostrarFavoritos}
      />

      {sucesso && (
        <div className="fixed top-[100px] left-1/2 -translate-x-1/2 z-[100] py-3 px-6 rounded-lg text-sm font-medium shadow-lg" style={{ background: 'var(--cor-primaria-suave)', color: 'var(--cor-primaria)', border: '1px solid var(--cor-primaria)' }}>
          {sucesso}
        </div>
      )}

      {mostrarAdmin ? (
        <Admin
          onVoltar={handleVoltarDoAdmin}
          produtos={produtos}
          nichos={nichos}
          onSalvarNichos={handleSalvarNichos}
          onExcluirNichos={handleExcluirNichos}
          onSalvarProduto={handleSalvarProduto}
          onExcluirProduto={handleExcluirProduto}
          onEditarProduto={handleEditarProduto}
        />
      ) : mostrarFavoritos ? (
        <Favoritos
          favoritos={favoritos}
          onVoltar={handleVoltarFavoritos}
          onSelecionarProduto={handleSelecionarProduto}
          onToggleFavorito={toggleFavorito}
          admin={admin}
          onEditarProduto={handleEditarProduto}
        />
      ) : mostrarPerfil ? (
        <Perfil
          onVoltar={handleVoltarDoPerfil}
          onMostrarAdmin={handleMostrarAdmin}
          onAdminLogin={handleAdminLogin}
          onAdminLogout={handleAdminLogout}
        />
      ) : pagina === 'detalhe' && produtoSelecionado ? (
        <ProdutoDetalhe
          produto={produtoSelecionado}
          produtos={produtos}
          nichos={nichos}
          onVoltar={voltarParaGenero}
          onSelecionar={handleSelecionarProduto}
          onAdicionarAoCarrinho={handleAdicionarAoCarrinho}
          noCarrinho={carrinho.some((item) => item.produto.id === produtoSelecionado.id)}
          favoritos={favoritos}
          onToggleFavorito={toggleFavorito}
          admin={admin}
          onEditarProduto={handleEditarProduto}
        />
      ) : pagina === 'genero' && genero ? (
        <Genero
          genero={genero}
          produtos={produtos}
          onSelecionarProduto={handleSelecionarProduto}
          favoritos={favoritos}
          onToggleFavorito={toggleFavorito}
          admin={admin}
          onEditarProduto={handleEditarProduto}
        />
      ) : (
        <Entrada
          produtos={produtos}
          nichos={nichos}
          onSelecionarGenero={handleSelecionarGenero}
          onSelecionarProduto={handleSelecionarProduto}
          favoritos={favoritos}
          onToggleFavorito={toggleFavorito}
          admin={admin}
          onEditarProduto={handleEditarProduto}
        />
      )}

      {mostrarCarrinho && (
        <CarrinhoDrawer
          itens={carrinho}
          onFechar={handleFecharCarrinho}
          onRemover={handleRemoverDoCarrinho}
          onAlterar={handleAlterarQuantidade}
          onFinalizar={handleFinalizar}
        />
      )}

      {!mostrarPerfil && !mostrarFavoritos && !mostrarAdmin && (
        <Footer
          onHome={handleVoltarHome}
          onSelecionarGenero={handleSelecionarGenero}
          onIrParaDestaques={handleIrParaDestaques}
        />
      )}

      {mostrarFormProduto && (
        <ProdutoFormModal
          produto={produtoEditando}
          nichos={nichos}
          onSalvar={handleSalvarProduto}
          onFechar={() => { setMostrarFormProduto(false); setProdutoEditando(null) }}
          onExcluir={handleExcluirProduto}
        />
      )}
    </div>
  )
}

export default App
