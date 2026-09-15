import { useState } from 'react'
import Card from './Card'
import Reveal from './Reveal'
import { produtos } from '../data/produtos'
import { Check } from './Icones'
import bannerRomance from '../assets/banner-romance.jpeg'
import bannerFantasia from '../assets/banner-fantasia.jpeg'
import bannerSuspense from '../assets/banner-suspense.jpeg'

const FILTROS = [
  { id: 'todos', nome: 'Todas as peças' },
  { id: 'decoracao', nome: 'Decorações avulsas' },
  { id: 'colecionavel', nome: 'Colecionáveis' },
]

function Genero({ genero, onSelecionarProduto, onAssinar, favoritos, onToggleFavorito }) {
  const [filtroTipo, setFiltroTipo] = useState('todos')

  const produtosDoGenero = produtos.filter((p) => p.genero === genero.id)
  const produtosFiltrados =
    filtroTipo === 'todos'
      ? produtosDoGenero
      : produtosDoGenero.filter((p) => p.tipo === filtroTipo)

  const opcoes = [
    {
      id: 'decoracao',
      titulo: 'Decorações avulsas',
      descricao: 'Peças únicas para decorar a sua estante, mesa ou casa — sem compromisso com assinatura.',
      icone: '🪄',
      acao: () => {
        setFiltroTipo('decoracao')
        document.getElementById('vitrine')?.scrollIntoView({ behavior: 'smooth' })
      },
    },
    {
      id: 'colecionavel',
      titulo: 'Colecionáveis',
      descricao: 'Edições especiais e detalhadas para os fãs que colecionam cada pedacinho do universo.',
      icone: '🏺',
      acao: () => {
        setFiltroTipo('colecionavel')
        document.getElementById('vitrine')?.scrollIntoView({ behavior: 'smooth' })
      },
    },
    {
      id: 'clube',
      titulo: 'Faça parte do Clube Locus',
      descricao: 'Receba peças exclusivas todos os meses com tema do seu gênero favorito — ou de todos eles.',
      icone: '📚',
      acao: onAssinar,
    },
  ]

  const IMAGENS_FUNDO = {
    romance:
      `url(${bannerRomance})`,
    fantasia:
      `url(${bannerFantasia})`,
    suspense:
      `url(${bannerSuspense})`,
  }
  const OVERLAYS_FUNDO = {
    romance: 'linear-gradient(to bottom, rgba(90, 20, 45, 0.08), rgba(90, 20, 45, 0.25))',
    fantasia: 'linear-gradient(to bottom, rgba(15, 32, 27, 0.55), rgba(15, 32, 27, 0.75))',
    suspense: 'linear-gradient(to bottom, rgba(8, 8, 16, 0.55), rgba(8, 8, 16, 0.8))',
  }
  const imagemFundo = IMAGENS_FUNDO[genero.id]
  const overlayFundo = OVERLAYS_FUNDO[genero.id]

  return (
    <section>
      <div
        className="relative min-h-[300px] md:min-h-[460px] flex flex-col items-center justify-center text-center px-6 py-16 overflow-hidden"
        style={imagemFundo ? { backgroundImage: imagemFundo, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: 'var(--fundo-decorativo)' }}
      >
        {overlayFundo && (
          <div
            className="absolute inset-0"
            style={{ background: overlayFundo }}
          />
        )}
        <div className="relative z-10">
          
          <h1 className="text-5xl md:text-6xl font-[Georgia,serif]" style={{ color: imagemFundo ? '#fff' : 'var(--cor-texto)' }}>
            Universo {genero.nome}
          </h1>
          <p className="mt-4 text-xl max-w-[620px] mx-auto" style={{ color: imagemFundo ? 'rgba(255,255,255,0.92)' : 'var(--cor-texto-suave)' }}>
            {genero.descricao}
          </p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 -mt-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {opcoes.map((opcao, i) => (
            <Reveal key={opcao.id} delay={i * 90} className="h-full">
<button
                onClick={opcao.acao}
                className="text-left rounded-[20px] p-7 cursor-pointer transition-all duration-700 hover:-translate-y-1 shadow-[0_10px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_18px_40px_rgba(0,0,0,0.2)] h-full w-full flex flex-col"
                style={{ background: 'var(--cor-fundo-cartao)', border: '1px solid var(--cor-borda)' }}
              >
              <span
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-4"
                style={{ background: 'var(--cor-primaria-suave)' }}
              >
                {opcao.icone}
              </span>
              <h3 className="text-xl font-semibold" style={{ color: 'var(--cor-texto)' }}>
                {opcao.titulo}
              </h3>
              <p className="mt-2 text-sm leading-relaxed flex-1" style={{ color: 'var(--cor-texto-suave)' }}>
                {opcao.descricao}
              </p>
              {opcao.id === 'clube' && (
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium"
                  style={{ color: 'var(--cor-primaria)' }}
                >
                  <Check className="w-4 h-4" />
                    Benefícios exclusivos
                  </span>
              )}
              </button>
            </Reveal>
          ))}
        </div>
      </div>

<div id="vitrine" className="relative py-[70px]">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <h2 className="text-4xl font-[Georgia,serif]" style={{ color: 'var(--cor-texto)' }}>
            Peças avulsas de {genero.nome}
          </h2>
        <p className="mt-4" style={{ color: 'var(--cor-texto-suave)' }}>
          Compre quando quiser, sem precisar assinar. Descrição, quantidade e personalização em cada peça.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {FILTROS.map((filtro) => (
            <button
              key={filtro.id}
              onClick={() => setFiltroTipo(filtro.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer border ${
                filtroTipo === filtro.id
                  ? 'text-white shadow-[0_8px_20px_rgba(0,0,0,0.2)]'
                  : ''
              }`}
              style={
                filtroTipo === filtro.id
                  ? { background: 'var(--cor-primaria)', borderColor: 'var(--cor-primaria)' }
                  : { background: 'var(--cor-fundo-suave)', color: 'var(--cor-texto)', borderColor: 'var(--cor-borda)' }
              }
            >
              {filtro.nome}
            </button>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {produtosFiltrados.map((produto, i) => (
            <Reveal key={produto.id} delay={i * 90}>
              <Card
                id={produto.id}
                nome={produto.nome}
                imagem={produto.imagem}
                preco={produto.preco}
                estoque={produto.estoque}
                tipo={produto.tipo}
                permiteUpload={produto.permiteUpload}
                onClick={() => onSelecionarProduto(produto)}
                favorito={favoritos.some((f) => f.id === produto.id)}
                onToggleFavorito={() => onToggleFavorito(produto)}
              />
            </Reveal>
          ))}
        </div>

        {produtosFiltrados.length === 0 && (
          <p className="mt-10 text-lg" style={{ color: 'var(--cor-texto-suave)' }}>
            Nenhuma peça encontrada neste filtro.
          </p>
        )}
        </div>
      </div>
    </section>
  )
}

export default Genero