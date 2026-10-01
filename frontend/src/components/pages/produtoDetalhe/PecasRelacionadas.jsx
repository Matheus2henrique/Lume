import Card from '../../ui/Card'
import Reveal from '../../ui/Reveal'

function PecasRelacionadas({ genero, relacionados, onVoltar, onSelecionar, favoritos, onToggleFavorito, admin, onEditarProduto }) {
  return (
    <div className="mt-14 mb-10">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-[Georgia,serif]" style={{ color: 'var(--cor-texto)' }}>
          Outras peças de {genero?.nome}
        </h2>
        <button
          onClick={onVoltar}
          className="text-sm underline cursor-pointer border-none bg-transparent"
          style={{ color: 'var(--cor-laranja-claro)' }}
        >
          Ver todas
        </button>
      </div>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[30px]">
        {relacionados.map((p, i) => (
          <Reveal key={p.id} delay={i * 90}>
            <Card
              nome={p.nome}
              imagem={p.imagem}
              preco={p.preco}
              estoque={p.estoque}
              tipo={p.tipo}
              permiteUpload={p.permiteUpload}
              onClick={() => onSelecionar(p)}
              favorito={favoritos.some((f) => f.id === p.id)}
              onToggleFavorito={() => onToggleFavorito(p)}
              admin={admin}
              onEditarProduto={onEditarProduto}
              produto={p}
            />
          </Reveal>
        ))}
      </div>
    </div>
  )
}

export default PecasRelacionadas
