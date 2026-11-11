import { useState, useRef, useEffect, useMemo } from 'react'
import { generos as generosPadrao } from '../../data/produtos'
import { normalizar, MAX_RESULTADOS } from './header/busca'
import Logo from './header/Logo'
import NavDesktop from './header/NavDesktop'
import BarraAcoes from './header/BarraAcoes'
import PainelBusca from './header/PainelBusca'
import MenuMobile from './header/MenuMobile'

const ATRASO_FECHO_NICHO = 200

function Header({ generoId, onSelecionarGenero, onHome, onMostrarPerfil, totalCarrinho = 0, onMostrarCarrinho, totalFavoritos = 0, onMostrarFavoritos, nichos, produtos = [], onSelecionarProduto, subcategorias = undefined }) {
  const [menuAberto, setMenuAberto] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const [busca, setBusca] = useState('')
  const [nichoAtivo, setNichoAtivo] = useState(null)
  const buscaRef = useRef(null)
  const buscaFormRef = useRef(null)
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
      const dentroPainel = buscaRef.current && buscaRef.current.contains(e.target)
      const dentroForm = buscaFormRef.current && buscaFormRef.current.contains(e.target)
      if (!dentroPainel && !dentroForm) setBuscando(false)
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
      className="h-[64px] md:h-[90px] border-b fixed top-0 left-0 right-0 z-40 header-tema header-vidro"
      style={{
        borderColor: 'var(--cor-borda)',
      }}
    >
      <div className="max-w-[1400px] h-full mx-auto flex items-center justify-between px-4 md:px-6">
        <Logo onHome={onHome} />

        <NavDesktop
          generos={generos}
          generoId={generoId}
          onSelecionarGenero={(id, sub) => {
            fecharNicho()
            onSelecionarGenero(id, sub)
          }}
          nichoAtivo={nichoAtivo}
          onAbrirNicho={abrirNicho}
          onAdiarFechamento={adiarFechamentoNicho}
          subcategorias={subcategorias}
        />

        {/* Busca fixa no desktop (estilo .header-search do modelo).
            Abre o mesmo PainelBusca com os resultados embaixo. */}
        <form
          ref={buscaFormRef}
          className="header-search"
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            confirmarPrimeiro()
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            aria-label="Buscar produtos"
            placeholder="Qual universo você procura?"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value)
              setBuscando(true)
            }}
            onFocus={() => {
              fecharNicho()
              setBuscando(true)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirmarPrimeiro()
              if (e.key === 'Escape') setBuscando(false)
            }}
          />
          <button type="submit" aria-label="Buscar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </form>

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
          subcategorias={subcategorias}
          onEscolherGenero={(id, sub) => navegar(() => onSelecionarGenero(id, sub))}
          onFechar={() => setMenuAberto(false)}
        />
      )}
    </header>
  )
}

export default Header
