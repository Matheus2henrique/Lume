import { useState, useEffect } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import Entrada from './components/Entrada'
import Genero from './components/Genero'
import ClubeLocus from './components/ClubeLocus'
import ProdutoDetalhe from './components/ProdutoDetalhe'
import Perfil from './components/Perfil'
import Favoritos from './components/Favoritos'
import CarrinhoDrawer from './components/Carrinho'
import { generos, produtos } from './data/produtos'
import { api, obterToken } from './api'

function normalizarProduto(p) {
  return {
    id: p.id,
    nome: p.nome,
    genero: p.genero,
    tipo: p.tipo,
    preco: Number(p.preco),
    estoque: p.estoque,
    permiteUpload: p.permite_upload,
    descricao: p.descricao,
    imagem: p.imagem,
  }
}

const BASE = '/locus'

function rotaParaURL({ generoId, pagina, produtoSelecionado, mostrarPerfil, mostrarFavoritos }) {
  if (mostrarPerfil) return `${BASE}/login`
  if (mostrarFavoritos) return `${BASE}/favoritos`
  if (pagina === 'clube') return `${BASE}/clube`
  if (pagina === 'detalhe' && produtoSelecionado && generoId)
    return `${BASE}/${generoId}/produto/${produtoSelecionado.id}`
  if (pagina === 'genero' && generoId) return `${BASE}/${generoId}`
  return `${BASE}`
}

function URLparaEstado(pathname) {
  const partes = pathname.replace(BASE, '').split('/').filter(Boolean)

  if (partes[0] === 'login') return { pagina: 'entrada', mostrarPerfil: true }
  if (partes[0] === 'favoritos') return { pagina: 'entrada', mostrarFavoritos: true }
  if (partes[0] === 'clube') return { pagina: 'clube' }
  if (partes[0] === 'produto') {
    const produto = produtos.find((p) => p.id === Number(partes[1]))
    if (produto) return { pagina: 'detalhe', generoId: produto.genero, produtoSelecionado: produto }
  }
  if (partes[0] && partes[1] === 'produto') {
    const generoId = generos.some((g) => g.id === partes[0]) ? partes[0] : null
    const produto = produtos.find((p) => p.id === Number(partes[2]) && p.genero === generoId)
    if (produto) return { pagina: 'detalhe', generoId, produtoSelecionado: produto }
  }
  if (generos.some((g) => g.id === partes[0])) return { pagina: 'genero', generoId: partes[0] }

  return { pagina: 'entrada', generoId: null }
}

function App() {
  const [generoId, setGeneroId] = useState(null)
  const [pagina, setPagina] = useState('entrada') // entrada | genero | clube | detalhe
  const [produtoSelecionado, setProdutoSelecionado] = useState(null)
  const [mostrarPerfil, setMostrarPerfil] = useState(false)
  const [mostrarFavoritos, setMostrarFavoritos] = useState(false)
  const [favoritos, setFavoritos] = useState([])
  const [carrinho, setCarrinho] = useState([])
  const [mostrarCarrinho, setMostrarCarrinho] = useState(false)

  const genero = generos.find((g) => g.id === generoId)

  function navegar(estado) {
    const proximo = { ...estado }
    setGeneroId(proximo.generoId ?? null)
    setPagina(proximo.pagina ?? 'entrada')
    setProdutoSelecionado(proximo.produtoSelecionado ?? null)
    setMostrarPerfil(Boolean(proximo.mostrarPerfil))
    setMostrarFavoritos(Boolean(proximo.mostrarFavoritos))
    window.scrollTo({ top: 0, behavior: 'smooth' })
    window.history.pushState(null, '', rotaParaURL(proximo))
  }

  useEffect(() => {
    function sincronizar() {
      const estado = URLparaEstado(window.location.pathname)
      setGeneroId(estado.generoId ?? null)
      setPagina(estado.pagina ?? 'entrada')
      setProdutoSelecionado(estado.produtoSelecionado ?? null)
      setMostrarPerfil(Boolean(estado.mostrarPerfil))
      setMostrarFavoritos(Boolean(estado.mostrarFavoritos))
    }
    sincronizar()
    window.addEventListener('popstate', sincronizar)
    return () => window.removeEventListener('popstate', sincronizar)
  }, [])

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

  function handleAssinar() {
    navegar({ pagina: 'clube' })
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

  function voltarParaGenero() {
    navegar({ generoId, pagina: 'genero' })
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
  const temaClasse = generoId ? `tema-${generoId}` : ''

  return (
    <div className={`w-full min-h-screen flex flex-col pt-[64px] md:pt-[90px] ${temaClasse}`} style={{ background: 'var(--cor-fundo)' }}>
      <Header
        generoId={generoId}
        onSelecionarGenero={handleSelecionarGenero}
        onHome={handleVoltarHome}
        onAssinar={handleAssinar}
        onMostrarPerfil={handleMostrarPerfil}
        totalCarrinho={totalCarrinho}
        onMostrarCarrinho={() => setMostrarCarrinho(true)}
        totalFavoritos={favoritos.length}
        onMostrarFavoritos={handleMostrarFavoritos}
      />

      {mostrarFavoritos ? (
        <Favoritos
          favoritos={favoritos}
          onVoltar={handleVoltarFavoritos}
          onSelecionarProduto={handleSelecionarProduto}
          onToggleFavorito={toggleFavorito}
        />
      ) : mostrarPerfil ? (
        <Perfil onVoltar={handleVoltarDoPerfil} />
      ) : pagina === 'detalhe' && produtoSelecionado ? (
        <ProdutoDetalhe
          produto={produtoSelecionado}
          onVoltar={voltarParaGenero}
          onSelecionar={handleSelecionarProduto}
          onAssinar={handleAssinar}
          onAdicionarAoCarrinho={handleAdicionarAoCarrinho}
          noCarrinho={carrinho.some((item) => item.produto.id === produtoSelecionado.id)}
          favoritos={favoritos}
          onToggleFavorito={toggleFavorito}
        />
      ) : pagina === 'clube' ? (
        <ClubeLocus genero={genero} onVoltar={voltarParaGenero} />
      ) : pagina === 'genero' && genero ? (
        <Genero
          genero={genero}
          onSelecionarProduto={handleSelecionarProduto}
          onAssinar={handleAssinar}
          favoritos={favoritos}
          onToggleFavorito={toggleFavorito}
        />
      ) : (
        <Entrada
          onSelecionarGenero={handleSelecionarGenero}
          onAssinar={handleAssinar}
          onSelecionarProduto={handleSelecionarProduto}
          favoritos={favoritos}
          onToggleFavorito={toggleFavorito}
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

      {!mostrarPerfil && !mostrarFavoritos && (
        <Footer
          onHome={handleVoltarHome}
          onSelecionarGenero={handleSelecionarGenero}
          onAssinar={handleAssinar}
          onIrParaDestaques={handleIrParaDestaques}
        />
      )}
    </div>
  )
}

export default App