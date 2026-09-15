import Card from './Card'
import Reveal from './Reveal'
import { SetaEsquerda } from './Icones'

function Favoritos({ favoritos, onVoltar, onSelecionarProduto, onToggleFavorito }) {
  return (
    <section className="min-h-screen py-12 px-6" style={{ background: 'var(--cor-fundo-suave)' }}>
      <div className="max-w-[1200px] mx-auto">
        <button
          onClick={onVoltar}
          className="flex items-center gap-2 text-base font-medium cursor-pointer hover:underline border-none bg-transparent"
          style={{ color: 'var(--cor-primaria)' }}
        >
          <SetaEsquerda className="w-5 h-5" />
          Voltar
        </button>

        <div className="mt-8">
          <h1 className="text-4xl font-[Georgia,serif]" style={{ color: 'var(--cor-texto)' }}>
            Meus favoritos
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--cor-texto-suave)' }}>
            {favoritos.length === 0
              ? 'Guarde aqui as peças que você ama para encontrá-las rápido.'
              : `${favoritos.length} peça${favoritos.length > 1 ? 's' : ''} salva${favoritos.length > 1 ? 's' : ''}.`}
          </p>
        </div>

        {favoritos.length === 0 ? (
          <div
            className="mt-10 rounded-[24px] p-12 text-center"
            style={{ background: 'var(--cor-fundo-cartao)', border: '1px solid var(--cor-borda)' }}
          >
            <span className="text-6xl">💛</span>
            <h2 className="mt-4 text-2xl font-[Georgia,serif]" style={{ color: 'var(--cor-texto)' }}>
              Nenhum favorito ainda
            </h2>
            <p className="mt-2 max-w-[420px] mx-auto" style={{ color: 'var(--cor-texto-suave)' }}>
              Toque no coração de uma peça para guardá-la aqui e encontrá-la fácil quando quiser.
            </p>
            <button
              onClick={onVoltar}
              className="mt-6 px-7 py-3.5 rounded-xl text-white font-medium cursor-pointer transition-all duration-300 hover:scale-[1.02] border-none"
              style={{ background: 'var(--cor-primaria)' }}
            >
              Explorar os mundos
            </button>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[30px]">
            {favoritos.map((produto, i) => (
              <Reveal key={produto.id} delay={i * 90}>
                <Card
                  id={produto.id}
                  nome={produto.nome}
                  imagem={produto.imagem}
                  preco={produto.preco}
                  estoque={produto.estoque}
                  tipo={produto.tipo}
                  permiteUpload={produto.permiteUpload}
                  favorito
                  onClick={() => onSelecionarProduto(produto)}
                  onToggleFavorito={() => onToggleFavorito(produto)}
                />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default Favoritos