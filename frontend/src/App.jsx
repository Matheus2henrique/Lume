import { useState, useEffect, useMemo } from 'react'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import Entrada from './components/pages/Entrada'
import Genero from './components/pages/Genero'
import ProdutoDetalhe from './components/pages/ProdutoDetalhe'
import Perfil from './components/pages/Perfil'
import Favoritos from './components/pages/Favoritos'
import CarrinhoDrawer from './components/pages/Carrinho'
import PedidoStatus from './components/pages/PedidoStatus'
import Privacidade from './components/pages/Privacidade'
import TrocasEDevolucoes from './components/pages/TrocasEDevolucoes'
import PerguntasFrequentes from './components/pages/PerguntasFrequentes'
import Admin from './components/pages/Admin'
import ProdutoFormModal from './components/ui/ProdutoFormModal'
import { generos as generosPadrao } from './data/produtos'
import { subcategorias as subcategoriasPadrao } from './data/subcategorias'
import { api, obterToken, obterUsuario } from './api'
import { normalizarProduto } from './utils/formatar'
import { carregarCarrinho, salvarCarrinho, chaveItem, normalizarOpcoes } from './utils/carrinho'

const BASE = '/Lume'

// O mapa estático (data/subcategorias.js) vira a mesma forma que a API
// devolve — lista com `genero` — para menus e admin usarem um formato só.
function listaDeSubcategoriasEstatica() {
  return Object.entries(subcategoriasPadrao).flatMap(([genero, subs]) =>
    subs.map((sub) => ({ ...sub, genero }))
  )
}

function rotaParaURL({ generoId, pagina, produtoSelecionado, mostrarPerfil, perfilCriandoConta, mostrarFavoritos, mostrarAdmin, pedidoId, subFiltro }) {
  if (mostrarAdmin) return `${BASE}/admin`
  // Login e cadastro têm URLs próprias (voltar/avançar do navegador funciona).
  if (mostrarPerfil) return perfilCriandoConta ? `${BASE}/login/criar-conta` : `${BASE}/login`
  if (mostrarFavoritos) return `${BASE}/favoritos`
  if (pagina === 'privacidade') return `${BASE}/privacidade`
  if (pagina === 'trocas') return `${BASE}/trocas-e-devolucoes`
  if (pagina === 'faq') return `${BASE}/perguntas-frequentes`
  if (pagina === 'pedido' && pedidoId) return `${BASE}/pedido/${pedidoId}`
  if (pagina === 'detalhe' && produtoSelecionado && generoId)
    return `${BASE}/${generoId}/produto/${produtoSelecionado.id}`
  if (pagina === 'genero' && generoId) {
    // ?sub= guarda a subpasta escolhida no menu: a página do nicho já abre
    // filtrada e o filtro sobrevive a recarregar e ao voltar/avançar.
    const query = subFiltro ? `?sub=${encodeURIComponent(subFiltro)}` : ''
    return `${BASE}/${generoId}${query}`
  }
  return `${BASE}`
}

function URLparaEstado(pathname, produtosLista) {
  const partes = pathname.replace(BASE, '').split('/').filter(Boolean)
  const subFiltro = new URLSearchParams(window.location.search).get('sub')

  if (partes[0] === 'admin') return { pagina: 'entrada', mostrarAdmin: true }
  if (partes[0] === 'login')
    return { pagina: 'entrada', mostrarPerfil: true, perfilCriandoConta: partes[1] === 'criar-conta' }
  if (partes[0] === 'favoritos') return { pagina: 'entrada', mostrarFavoritos: true }
  if (partes[0] === 'privacidade') return { pagina: 'privacidade' }
  if (partes[0] === 'trocas-e-devolucoes') return { pagina: 'trocas' }
  if (partes[0] === 'perguntas-frequentes') return { pagina: 'faq' }
  if (partes[0] === 'pedido') {
    const pedidoId = Number(partes[1])
    if (Number.isInteger(pedidoId) && pedidoId > 0) return { pagina: 'pedido', pedidoId }
    return { pagina: 'entrada', generoId: null }
  }
  if (partes[0] === 'produto') {
    const produto = produtosLista.find((p) => p.id === Number(partes[1]))
    if (produto) return { pagina: 'detalhe', generoId: produto.genero, produtoSelecionado: produto }
  }
  if (partes[0] && partes[1] === 'produto') {
    const generoId = produtosLista.some((p) => p.genero === partes[0]) ? partes[0] : null
    const produto = produtosLista.find((p) => p.id === Number(partes[2]) && p.genero === generoId)
    if (produto) return { pagina: 'detalhe', generoId, produtoSelecionado: produto }
  }
  if (partes[0]) return { pagina: 'genero', generoId: partes[0], subFiltro }

  return { pagina: 'entrada', generoId: null }
}

function App() {
  const [admin, setAdmin] = useState(() => {
    const usuario = obterUsuario()
    return Boolean(usuario?.admin)
  })
  const [produtos, setProdutos] = useState([])
  const [nichos, setNichos] = useState(generosPadrao)
  // Banners do slideshow da home (imagem + nicho de destino).
  const [banners, setBanners] = useState([])
  const [generoId, setGeneroId] = useState(null)
  // Subpasta escolhida no menu (?sub=): o filtro inicial da página do nicho.
  const [subFiltro, setSubFiltro] = useState(null)
  // Subpastas do menu vindas do banco. null = API indisponível (usa o mapa
  // estático); lista vazia = admin apagou todas de propósito (respeita).
  const [subcategoriasLista, setSubcategoriasLista] = useState(null)
  const [pagina, setPagina] = useState('entrada')
  const [produtoSelecionado, setProdutoSelecionado] = useState(null)
  const [mostrarPerfil, setMostrarPerfil] = useState(false)
  // Dentro da tela de perfil, o cadastro tem URL própria (/Lume/login/criar-conta).
  const [perfilCriandoConta, setPerfilCriandoConta] = useState(false)
  const [mostrarFavoritos, setMostrarFavoritos] = useState(false)
  const [mostrarAdmin, setMostrarAdmin] = useState(false)
  const [favoritos, setFavoritos] = useState([])
  // Carrinho persiste no navegador: recarregar a página não perde a compra.
  const [carrinho, setCarrinho] = useState(() => carregarCarrinho())
  const [pedidoId, setPedidoId] = useState(null)
  const [mostrarCarrinho, setMostrarCarrinho] = useState(false)
  const [produtoEditando, setProdutoEditando] = useState(null)
  const [mostrarFormProduto, setMostrarFormProduto] = useState(false)
  const [sucesso, setSucesso] = useState('')

  const genero = nichos.find((g) => g.id === generoId)

  // nicho → subpastas, no formato que menus e página do nicho já consumiam.
  const mapaSubcategorias = useMemo(() => {
    const fonte = subcategoriasLista ?? listaDeSubcategoriasEstatica()
    return fonte.reduce((mapa, sub) => {
      if (!mapa[sub.genero]) mapa[sub.genero] = []
      mapa[sub.genero].push(sub)
      return mapa
    }, {})
  }, [subcategoriasLista])

  useEffect(() => {
    api.produtos.listar()
      .then((lista) => setProdutos(lista))
      .catch(() => {})
    api.generos.listar()
      .then((lista) => { if (lista.length > 0) setNichos(lista) })
      .catch(() => {})
    api.subcategorias.listar()
      .then((lista) => setSubcategoriasLista(lista))
      .catch(() => {})
    api.banners.listar()
      .then((lista) => setBanners(lista))
      .catch(() => {})
  }, [])

  function mostrarMensagem(msg) {
    setSucesso(msg)
    setTimeout(() => setSucesso(''), 3000)
  }

  // Persiste o carrinho a cada mudança (salvarCarrinho ignora falha de cota).
  useEffect(() => {
    salvarCarrinho(carrinho)
  }, [carrinho])

  function navegar(estado) {
    const proximo = { ...estado }
    setGeneroId(proximo.generoId ?? null)
    setPagina(proximo.pagina ?? 'entrada')
    setProdutoSelecionado(proximo.produtoSelecionado ?? null)
    setMostrarPerfil(Boolean(proximo.mostrarPerfil))
    setPerfilCriandoConta(Boolean(proximo.perfilCriandoConta))
    setMostrarFavoritos(Boolean(proximo.mostrarFavoritos))
    setMostrarAdmin(Boolean(proximo.mostrarAdmin))
    setPedidoId(proximo.pedidoId ?? null)
    setSubFiltro(proximo.subFiltro ?? null)
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
      setPerfilCriandoConta(Boolean(estado.perfilCriandoConta))
      setMostrarFavoritos(Boolean(estado.mostrarFavoritos))
      setMostrarAdmin(Boolean(estado.mostrarAdmin))
      setPedidoId(estado.pedidoId ?? null)
      setSubFiltro(estado.subFiltro ?? null)
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

  function handleSelecionarGenero(id, sub = null) {
    navegar({ generoId: id, pagina: 'genero', subFiltro: sub })
  }

  // Troca o filtro da vitrine sem sair da página: guarda o estado e a URL
  // (?sub=) juntos, para o filtro sobreviver a recarregar e ao voltar/avançar.
  function handleFiltrarGenero(sub) {
    setSubFiltro(sub)
    window.history.pushState(null, '', rotaParaURL({ generoId, pagina: 'genero', subFiltro: sub }))
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

  // O Perfil avisa quando troca de formulário: registrar fica em
  // /Lume/login/criar-conta; login e demais modos ficam em /Lume/login.
  function handlePerfilMudarModo(modo) {
    const destino = rotaParaURL({
      pagina: 'entrada',
      mostrarPerfil: true,
      perfilCriandoConta: modo === 'registrar',
    })
    // URL já é a destino: não empilha histórico duplicado.
    if (destino === window.location.pathname) return
    navegar({ pagina: 'entrada', mostrarPerfil: true, perfilCriandoConta: modo === 'registrar' })
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
    // Volta para o mesmo filtro que estava ativo antes de abrir a peça.
    navegar({ generoId, pagina: 'genero', subFiltro })
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
        subcategoria: dados.subcategoria || '',
        tipo: dados.tipo,
        preco: dados.preco,
        estoque: dados.estoque,
        permite_upload: dados.permiteUpload ?? dados.permite_upload,
        descricao: dados.descricao,
        imagem: dados.imagem || dados.imagemUrl?.trim() || '',
        // Dimensões usadas pelo Melhor Envio na cotação do frete.
        peso: dados.peso ?? null,
        altura: dados.altura ?? null,
        largura: dados.largura ?? null,
        comprimento: dados.comprimento ?? null,
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
      // As subpastas do nicho caem junto (ON DELETE CASCADE no banco).
      setSubcategoriasLista((atual) => atual?.filter((s) => s.genero !== id) ?? atual)
      // Banners do nicho também caem junto (ON DELETE CASCADE).
      setBanners((atual) => atual.filter((b) => b.genero !== id))
      mostrarMensagem('Nichos excluído!')
    } catch (err) {
      mostrarMensagem(err.message || 'Erro ao excluir nicho.')
    }
  }

  async function handleSalvarSubcategoria(dados) {
    try {
      const fonte = subcategoriasLista ?? listaDeSubcategoriasEstatica()
      const existente = fonte.some((s) => s.id === dados.id)
      if (existente) {
        const atualizado = await api.subcategorias.atualizar(dados.id, dados)
        setSubcategoriasLista(fonte.map((s) => (s.id === dados.id ? atualizado : s)))
        mostrarMensagem('Subpasta atualizada!')
      } else {
        const criada = await api.subcategorias.criar(dados)
        setSubcategoriasLista([...fonte, criada])
        mostrarMensagem('Subpasta criada!')
      }
    } catch (err) {
      mostrarMensagem(err.message || 'Erro ao salvar subpasta.')
    }
  }

  async function handleExcluirSubcategoria(id) {
    try {
      await api.subcategorias.excluir(id)
      setSubcategoriasLista((atual) => (atual ?? []).filter((s) => s.id !== id))
      // O backend limpou produtos.subcategoria: ressincroniza a loja.
      api.produtos.listar().then((lista) => setProdutos(lista)).catch(() => {})
      mostrarMensagem('Subpasta excluída!')
    } catch (err) {
      mostrarMensagem(err.message || 'Erro ao excluir subpasta.')
    }
  }

  async function handleSalvarBanner(dados) {
    try {
      if (dados.id) {
        const atualizado = await api.banners.atualizar(dados.id, dados)
        setBanners((atual) => atual.map((b) => (b.id === dados.id ? atualizado : b)))
        mostrarMensagem('Banner atualizado!')
      } else {
        const criado = await api.banners.criar(dados)
        setBanners((atual) => [...atual, criado])
        mostrarMensagem('Banner adicionado!')
      }
    } catch (err) {
      mostrarMensagem(err.message || 'Erro ao salvar banner.')
    }
  }

  async function handleExcluirBanner(id) {
    try {
      await api.banners.excluir(id)
      setBanners((atual) => atual.filter((b) => b.id !== id))
      mostrarMensagem('Banner excluído!')
    } catch (err) {
      mostrarMensagem(err.message || 'Erro ao excluir banner.')
    }
  }

  // `opcoes` = { cor, tamanho } escolhidos na página do produto. Cada
  // combinação é uma linha própria do carrinho (camisa M preta ≠ camisa G preta).
  function handleAdicionarAoCarrinho(produto, quantidade = 1, personalizacao = null, opcoes = null) {
    const variacao = normalizarOpcoes(opcoes)
    const chave = chaveItem({ produto, opcoes: variacao })

    setCarrinho((atual) => {
      // Teto do estoque: nem somando no carrinho dá para passar do disponível.
      const estoque = Number(produto?.estoque)
      const limite = Number.isFinite(estoque) && estoque >= 0 ? estoque : Infinity
      if (limite <= 0) return atual

      const existente = atual.find((item) => chaveItem(item) === chave)
      if (existente) {
        return atual.map((item) =>
          chaveItem(item) === chave
            ? {
                ...item,
                quantidade: Math.min(item.quantidade + quantidade, limite),
                // Arquivo novo substitui o anterior; sem arquivo novo, mantém o que já tinha.
                personalizacao: personalizacao ?? item.personalizacao ?? null,
              }
            : item
        )
      }
      return [
        ...atual,
        { produto, quantidade: Math.min(quantidade, limite), personalizacao: personalizacao ?? null, opcoes: variacao },
      ]
    })
    setMostrarCarrinho(true)
  }

  function handleRemoverDoCarrinho(chave) {
    setCarrinho((atual) => atual.filter((item) => chaveItem(item) !== chave))
  }

  function handleRemoverPersonalizacao(chave) {
    setCarrinho((atual) =>
      atual.map((item) => (chaveItem(item) === chave ? { ...item, personalizacao: null } : item))
    )
  }

  function handleAlterarQuantidade(chave, delta) {
    setCarrinho((atual) =>
      atual
        .map((item) => {
          if (chaveItem(item) !== chave) return item
          const estoque = Number(item.produto.estoque)
          const limite = Number.isFinite(estoque) && estoque >= 0 ? estoque : Infinity
          return {
            ...item,
            quantidade: Math.min(Math.max(item.quantidade + delta, 0), limite),
          }
        })
        .filter((item) => item.quantidade > 0)
    )
  }

  function handleFecharCarrinho() {
    setMostrarCarrinho(false)
  }

  // Compra exige conta: fecha o carrinho e leva para a tela de login.
  function handleEntrarDoCarrinho() {
    setMostrarCarrinho(false)
    navegar({ pagina: 'entrada', mostrarPerfil: true })
  }

  async function handleFinalizar(dados) {
    const pedido = await api.criarPedido(dados)
    setCarrinho([])
    api.produtos
      .listar()
      .then((lista) => setProdutos(lista))
      .catch(() => {})
    return pedido
  }

  function handleIrParaDestaques() {
    navegar({ generoId: null, pagina: 'entrada' })
    setTimeout(() => {
      document.getElementById('destaques')?.scrollIntoView({ behavior: 'smooth' })
    }, 60)
  }

  const totalCarrinho = carrinho.reduce((soma, item) => soma + item.quantidade, 0)

  // Carrinho "fino": cada item aponta para o produto do catálogo ATUAL —
  // recupera imagem/preço/estoque frescos sem gravar estado dentro de efeito.
  // Produto removido da loja mantém o snapshot salvo (o backend revalida no checkout).
  const carrinhoSincronizado = carrinho.map((item) => {
    const real = produtos.find((p) => p.id === item.produto.id)
    return real ? { ...item, produto: real } : item
  })

  return (
    <div className="w-full min-h-screen flex flex-col pt-[64px] md:pt-[90px]" style={{ background: 'var(--cor-fundo)' }}>
      <Header
        generoId={generoId}
        onSelecionarGenero={handleSelecionarGenero}
        onSelecionarProduto={handleSelecionarProduto}
        onHome={handleVoltarHome}
        onMostrarPerfil={handleMostrarPerfil}
        totalCarrinho={totalCarrinho}
        onMostrarCarrinho={() => setMostrarCarrinho(true)}
        totalFavoritos={favoritos.length}
        onMostrarFavoritos={handleMostrarFavoritos}
        nichos={nichos}
        produtos={produtos}
        subcategorias={mapaSubcategorias}
      />

      {sucesso && (
        <div className="fixed top-[100px] left-1/2 -translate-x-1/2 z-[100] py-3 px-6 rounded-lg text-sm font-medium shadow-lg" style={{ background: 'var(--cor-laranja)', color: 'var(--cor-texto)', border: '1px solid var(--cor-laranja)' }}>
          {sucesso}
        </div>
      )}

      {mostrarAdmin ? (
        <Admin
          onVoltar={handleVoltarDoAdmin}
          produtos={produtos}
          nichos={nichos}
          subcategorias={mapaSubcategorias}
          onSalvarNichos={handleSalvarNichos}
          onExcluirNichos={handleExcluirNichos}
          onSalvarSubcategoria={handleSalvarSubcategoria}
          onExcluirSubcategoria={handleExcluirSubcategoria}
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
          modoInicial={perfilCriandoConta ? 'registrar' : 'login'}
          onMudarModo={handlePerfilMudarModo}
        />
      ) : pagina === 'pedido' && pedidoId ? (
        <PedidoStatus
          pedidoId={pedidoId}
          onVoltar={handleVoltarHome}
          onEntrar={handleMostrarPerfil}
        />
      ) : pagina === 'privacidade' ? (
        <Privacidade onVoltar={handleVoltarHome} />
      ) : pagina === 'trocas' ? (
        <TrocasEDevolucoes onVoltar={handleVoltarHome} />
      ) : pagina === 'faq' ? (
        <PerguntasFrequentes onVoltar={handleVoltarHome} />
      ) : pagina === 'detalhe' && produtoSelecionado ? (
        <ProdutoDetalhe
          key={produtoSelecionado.id}
          produto={produtoSelecionado}
          produtos={produtos}
          nichos={nichos}
          onVoltar={voltarParaGenero}
          onSelecionar={handleSelecionarProduto}
          onAdicionarAoCarrinho={handleAdicionarAoCarrinho}
          chavesNoCarrinho={carrinho.map((item) => chaveItem(item))}
          favoritos={favoritos}
          onToggleFavorito={toggleFavorito}
          admin={admin}
          onEditarProduto={handleEditarProduto}
        />
      ) : pagina === 'genero' && genero ? (
        <Genero
          genero={genero}
          produtos={produtos}
          subcategorias={mapaSubcategorias}
          subFiltro={subFiltro}
          onFiltrar={handleFiltrarGenero}
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
          banners={banners}
          onSelecionarGenero={handleSelecionarGenero}
          onSelecionarProduto={handleSelecionarProduto}
          favoritos={favoritos}
          onToggleFavorito={toggleFavorito}
          admin={admin}
          onEditarProduto={handleEditarProduto}
          onSalvarNichos={handleSalvarNichos}
          onExcluirNichos={handleExcluirNichos}
          onSalvarBanner={handleSalvarBanner}
          onExcluirBanner={handleExcluirBanner}
        />
      )}

      {mostrarCarrinho && (
        <CarrinhoDrawer
          itens={carrinhoSincronizado}
          onFechar={handleFecharCarrinho}
          onRemover={handleRemoverDoCarrinho}
          onAlterar={handleAlterarQuantidade}
          onRemoverPersonalizacao={handleRemoverPersonalizacao}
          onFinalizar={handleFinalizar}
          onEntrar={handleEntrarDoCarrinho}
          onVerPedido={(id) => {
            setMostrarCarrinho(false)
            navegar({ pagina: 'pedido', pedidoId: id })
          }}
        />
      )}

      {!mostrarPerfil && !mostrarFavoritos && !mostrarAdmin && (
        <Footer
          onHome={handleVoltarHome}
          onSelecionarGenero={handleSelecionarGenero}
          onIrParaDestaques={handleIrParaDestaques}
          onPrivacidade={() => navegar({ pagina: 'privacidade' })}
          onTrocas={() => navegar({ pagina: 'trocas' })}
          onFaq={() => navegar({ pagina: 'faq' })}
          nichos={nichos}
        />
      )}

      {mostrarFormProduto && (
        <ProdutoFormModal
          produto={produtoEditando}
          nichos={nichos}
          subcategorias={mapaSubcategorias}
          onSalvar={handleSalvarProduto}
          onFechar={() => { setMostrarFormProduto(false); setProdutoEditando(null) }}
          onExcluir={handleExcluirProduto}
        />
      )}
    </div>
  )
}

export default App
