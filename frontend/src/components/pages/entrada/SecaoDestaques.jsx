import Card from '../../ui/Card'
import Reveal from '../../ui/Reveal'

function SecaoDestaques({
  destaque,
  favoritos,
  onSelecionarProduto,
  onToggleFavorito,
  admin,
  onEditarProduto,
}) {
  if (!destaque.length) return null
  return (
    <div id="destaques" className="mt-[100px]">
      <div className="flex items-end justify-between">
        <div>
          <span
            className="inline-block px-4 py-1.5 rounded-full text-sm font-medium"
            style={{ background: 'var(--cor-laranja)', color: 'var(--cor-texto)' }}
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
              nome={produto.nome}
              imagem={produto.imagem}
              preco={produto.preco}
              estoque={produto.estoque}
              tipo={produto.tipo}
              permiteUpload={produto.permiteUpload}
              onClick={() => onSelecionarProduto(produto)}
              favorito={favoritos.some((f) => f.id === produto.id)}
              onToggleFavorito={() => onToggleFavorito(produto)}
              admin={admin}
              onEditarProduto={onEditarProduto}
              produto={produto}
            />
          </Reveal>
        ))}
      </div>
    </div>
  )
}

export default SecaoDestaques
