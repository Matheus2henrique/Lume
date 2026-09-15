import Card from './Card'
import Reveal from './Reveal'
import { generos, produtos } from '../data/produtos'
import { Check } from './Icones'

function Entrada({ onSelecionarGenero, onAssinar, onSelecionarProduto, favoritos, onToggleFavorito }) {
  const destaque = [1, 11, 15, 9]
    .map((id) => produtos.find((p) => p.id === id))
    .filter(Boolean)

  return (
    <section>
      <div className="min-h-[380px] md:min-h-[420px] flex flex-col items-center justify-center text-center px-5 md:px-6"
        style={{ background: 'var(--fundo-decorativo)' }}
      >
        <span
          className="tracking-[8px] text-xs md:text-sm"
          style={{ color: 'var(--cor-texto-suave)', animation: 'aparecer 0.7s ease-out 0.12s both' }}
        >
          PARA QUEM VIVE DENTRO DOS LIVROS
        </span>
        <h1
          className="text-4xl sm:text-5xl md:text-6xl leading-[0.95] my-5 font-[Georgia,serif]"
          style={{ color: 'var(--cor-texto)', animation: 'aparecer 0.7s ease-out 0.28s both' }}
        >
          Locus — onde suas
          <br />
          histórias ganham forma
        </h1>
        <p
          className="text-lg sm:text-xl max-w-[560px]"
          style={{ color: 'var(--cor-texto-suave)', animation: 'aparecer 0.7s ease-out 0.44s both' }}
        >
          Decorações, colecionáveis e o Clube Locus para os leitores que querem
          levar o seu gênero favorito para todos os cantos.
        </p>
      </div>

      <div className="max-w-[1200px] mx-auto py-[70px] px-6">
        <h2 className="text-center text-4xl font-[Georgia,serif]" style={{ color: 'var(--cor-texto)' }}>
          Escolha o seu universo
        </h2>
        <p className="mt-4 text-center" style={{ color: 'var(--cor-texto-suave)' }}>
          Toque em um gênero e entre em uma página com a cara dele.
        </p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {generos.map((genero) => (
            <button
              key={genero.id}
              onClick={() => onSelecionarGenero(genero.id)}
              className="group relative h-[340px] overflow-hidden rounded-[24px] cursor-pointer border-none text-left shadow-[0_10px_30px_rgba(0,0,0,0.15)]"
            >
              <img
                src={genero.imagem}
                alt={genero.nome}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-135"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-7">
                <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm text-white mb-3">
                  {genero.tagline}
                </span>
                <h3 className="text-3xl font-[Georgia,serif] text-white">{genero.nome}</h3>
                <p className="mt-2 text-white/80 text-sm leading-relaxed line-clamp-2">{genero.descricao}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-white font-semibold">
                  Entrar no universo
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-16 flex flex-wrap justify-center gap-6 sm:gap-10">
          {generos.map((genero) => (
            <button
              key={genero.id}
              onClick={() => onSelecionarGenero(genero.id)}
              className="group flex flex-col items-center cursor-pointer border-none bg-transparent"
            >
              <span className="relative w-24 h-24 sm:w-34 sm:h-34 md:w-[11.4rem] md:h-[11.4rem] rounded-full overflow-hidden transition-all duration-700 group-hover:scale-110 group-hover:-translate-y-1 shadow-[0_10px_30px_rgba(0,0,0,0.18)] group-hover:shadow-[0_18px_45px_rgba(0,0,0,0.28)]">
                <img
                  src={genero.imagem}
                  alt={genero.nome}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-125"
                />
                <span
                  className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: 'color-mix(in srgb, var(--cor-primaria) 35%, transparent)' }}
                />
              </span>
              <span
                className="mt-3 text-base font-semibold transition-colors duration-300"
                style={{ color: 'var(--cor-texto)' }}
              >
                {genero.nome}
              </span>
            </button>
          ))}
        </div>

        <div id="destaques" className="mt-[100px]">
          <div className="flex items-end justify-between">
            <div>
              <span
                className="inline-block px-4 py-1.5 rounded-full text-sm font-medium"
                style={{ background: 'var(--cor-primaria-suave)', color: 'var(--cor-primaria)' }}
              >
                Destaques da loja
              </span>
              <h2 className="mt-3 text-4xl font-[Georgia,serif]" style={{ color: 'var(--cor-texto)' }}>
                Peças favoritas dos leitores
              </h2>
              <p className="mt-2" style={{ color: 'var(--cor-texto-suave)' }}>
                As mais pedidas de cada universo, prontas para encomenda.
              </p>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[30px]">
            {destaque.map((produto, i) => (
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
        </div>

        <div className="mt-[100px]">
          <div
            className="relative overflow-hidden rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
            style={{ background: '#c4ad89', color: 'var(--cor-texto)' }}
          >
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background:
                  'radial-gradient(circle at 15% 20%, rgba(255,255,255,0.35), transparent 45%), radial-gradient(circle at 85% 80%, rgba(255,255,255,0.25), transparent 45%)',
              }}
            />
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 items-center gap-8 lg:gap-10 p-8 md:p-14">
              <div>
                <span
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium text-white"
                  style={{ background: 'var(--cor-primaria)' }}
                >
                  <Check className="w-4 h-4" />
                  Clube Locus
                </span>
                <h2 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-[Georgia,serif] leading-[1.05]">
                  Peças exclusivas
                  <br />
                  todo mês, do seu mundo
                </h2>
                <p className="mt-4 text-base sm:text-lg max-w-[460px] opacity-80">
                  Assine, escolha até 3 gêneros e receba decorações e colecionáveis que só assinantes têm.
                  Sem mensalidade escondida.
                </p>
                <div className="mt-7 flex flex-wrap gap-4">
                  <button
                    onClick={onAssinar}
                    className="px-6 sm:px-7 py-3.5 rounded-xl font-semibold text-white cursor-pointer transition-all duration-300 hover:scale-[1.03] border-none"
                    style={{ background: 'var(--cor-primaria)' }}
                  >
                    Assinar agora
                  </button>
                  <span className="inline-flex items-center gap-2 text-sm opacity-90">
                    <Check className="w-4 h-4" />
                    Cancelamento fácil
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {[
                  ['📦', 'Peça por mês', 'nova entrega'],
                  ['🎨', 'Personalizável', 'do seu jeito'],
                  ['🎁', 'Edições', 'só para assinantes'],
                ].map(([emoji, titulo, detalhe]) => (
                  <div
                    key={titulo}
                    className="rounded-2xl p-3 sm:p-5 text-center backdrop-blur-sm"
                    style={{ background: 'rgba(255,255,255,0.35)' }}
                  >
                    <span className="text-2xl sm:text-3xl">{emoji}</span>
                    <p className="mt-3 text-xs sm:text-sm font-semibold leading-tight">{titulo}</p>
                    <p className="mt-1 text-[11px] sm:text-xs opacity-80">{detalhe}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Entrada