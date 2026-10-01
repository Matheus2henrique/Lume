import { useState, useRef, useEffect, useMemo } from 'react'
import { generos as generosPadrao } from '../../data/produtos'
import { normalizar, MAX_RESULTADOS } from './header/busca'
import Logo from './header/Logo'
import NavDesktop from './header/NavDesktop'
import BarraAcoes from './header/BarraAcoes'
import PainelBusca from './header/PainelBusca'
import MenuMobile from './header/MenuMobile'

const ATRASO_FECHO_NICHO = 200

function Header({ generoId, onSelecionarGenero, onHome, onMostrarPerfil, totalCarrinho = 0, onMostrarCarrinho, totalFavoritos = 0, onMostrarFavoritos, nichos, produtos = [], onSelecionarProduto }) {
  const [menuAberto, setMenuAberto] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const [busca, setBusca] = useState('')
  const [nichoAtivo, setNichoAtivo] = useState(null)
  const buscaRef = useRef(null)
  const nichoTimerRef = useRef(null)
  const generos = nichos?.length ? nichos : generosPadrao

  // Busca dinâmica: filtra os nichos e os produtos que estão no estado atual
  // da loja — nicho/produto criado pelo admin aparece sem mexer em mais nada.
  const { produtosEncontrados, nichosEncontrados } = useMemo(() => {
    const alvo = normalizar(busca.trim())
    if (!alvo) return { produtosEncontrados: [], nichosEncontrados: [] }

    const nomeGeneroBusca = (id) => generos.find((g) => g.id === id)?.nome ?? ''

    return {
      produtosEncontrados: produtos
        .filter(
          (p) =>
            normalizar(p.nome).includes(alvo) ||
            normalizar(p.descricao).includes(alvo) ||
            normalizar(nomeGeneroBusca(p.genero)).includes(alvo)
        )
        .slice(0, MAX_RESULTADOS),
      nichosEncontrados: generos
        .filter(
          (g) =>
            normalizar(g.nome).includes(alvo) ||
            normalizar(g.tagline).includes(alvo) ||
            normalizar(g.id).includes(alvo)
        )
        .slice(0, MAX_RESULTADOS),
    }
  }, [busca, generos, produtos])

  const temResultado = produtosEncontrados.length > 0 || nichosEncontrados.length > 0
  const nomeGenero = (id) => generos.find((g) => g.id === id)?.nome ?? ''

  useEffect(() => {
    if (!buscando) return
    function fechar(e) {
      if (buscaRef.current && !buscaRef.current.contains(e.target)) setBuscando(false)
    }
    document.addEventListener('mousedown', fechar)
    return () => document.removeEventListener('mousedown', fechar)
  }, [buscando])

  // Mega-menu de nicho: abre ao passar o mouse no item e só fecha depois que o
  // ponteiro saiu dele E do painel — o atraso evita piscar ao atravessar o vão.
  useEffect(() => () => clearTimeout(nichoTimerRef.current), [])

  function abrirNicho(id) {
    clearTimeout(nichoTimerRef.current)
    if (buscando) setBuscando(false)
    setNichoAtivo(id)
  }

  function adiarFechamentoNicho() {
    clearTimeout(nichoTimerRef.current)
    nichoTimerRef.current = setTimeout(() => setNichoAtivo(null), ATRASO_FECHO_NICHO)
  }

  function fecharNicho() {
    clearTimeout(nichoTimerRef.current)
    setNichoAtivo(null)
  }

  function limparBusca() {
    setBuscando(false)
    setBusca('')
    setMenuAberto(false)
  }

  function confirmarBusca(genero) {
    if (!genero) return
    limparBusca()
    onSelecionarGenero(genero.id)
  }

  function confirmarProduto(produto) {
    if (!produto) return
    limparBusca()
    onSelecionarProduto?.(produto)
  }

  /** Enter: abre o primeiro resultado (produto, senão universo). */
  function confirmarPrimeiro() {
    if (produtosEncontrados[0]) confirmarProduto(produtosEncontrados[0])
    else if (nichosEncontrados[0]) confirmarBusca(nichosEncontrados[0])
  }

  function navegar(acao) {
    setMenuAberto(false)
    acao()
  }

  return (
    <header
      className="h-[64px] md:h-[90px] border-b fixed top-0 left-0 right-0 z-40 header-tema"
      style={{
        background: 'var(--cor-fundo-cartao)',
        borderColor: 'var(--cor-borda)',
      }}
    >
      <div className="max-w-[1400px] h-full mx-auto flex items-center justify-between px-4 md:px-6">
        <Logo onHome={onHome} />

        <NavDesktop
          generos={generos}
          generoId={generoId}
          onSelecionarGenero={(id) => {
            fecharNicho()
            onSelecionarGenero(id)
          }}
          nichoAtivo={nichoAtivo}
          onAbrirNicho={abrirNicho}
          onAdiarFechamento={adiarFechamentoNicho}
          produtos={produtos}
          onEscolherProduto={(produto) => {
            fecharNicho()
            limparBusca()
            onSelecionarProduto?.(produto)
          }}
        />

        <BarraAcoes
          buscando={buscando}
          onAbrirBusca={() => {
            fecharNicho()
            setBuscando(true)
          }}
          totalFavoritos={totalFavoritos}
          onMostrarFavoritos={onMostrarFavoritos}
          onMostrarPerfil={onMostrarPerfil}
          totalCarrinho={totalCarrinho}
          onMostrarCarrinho={onMostrarCarrinho}
          menuAberto={menuAberto}
          onAlternarMenu={() => setMenuAberto((m) => !m)}
        />
      </div>

      {buscando && (
        <PainelBusca
          containerRef={buscaRef}
          busca={busca}
          onMudarBusca={setBusca}
          onEnter={confirmarPrimeiro}
          onEsc={() => setBuscando(false)}
          temResultado={temResultado}
          produtosEncontrados={produtosEncontrados}
          nichosEncontrados={nichosEncontrados}
          nomeGenero={nomeGenero}
          onEscolherProduto={confirmarProduto}
          onEscolherGenero={confirmarBusca}
        />
      )}

      {menuAberto && (
        <MenuMobile
          generos={generos}
          generoId={generoId}
          onEscolherGenero={(id) => navegar(() => onSelecionarGenero(id))}
          onFechar={() => setMenuAberto(false)}
        />
      )}
    </header>
  )
}

export default Header
