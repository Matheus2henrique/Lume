import { formatarMoeda, formatarNota, formatarTotalAvaliacoes } from '../../../utils/formatar'
import { Estrela } from '../../ui/Icones'

function InfoProduto({ genero, produto, media = 0, total = 0 }) {
  return (
    <>
      <nav className="text-sm" style={{ color: 'var(--cor-texto-suave)' }}>
        <span>{genero?.nome}</span>
        <span className="mx-2">/</span>
        <span className="font-medium" style={{ color: 'var(--cor-texto)' }}>
          {produto.nome}
        </span>
      </nav>

      <h1 className="mt-3 text-4xl font-[Georgia,serif] leading-tight" style={{ color: 'var(--cor-texto)' }}>
        {produto.nome}
      </h1>

      <div className="mt-4 flex items-center gap-3 text-sm">
        <Estrela className="w-5 h-5 text-amber-400" />
        <span className="font-semibold" style={{ color: 'var(--cor-texto)' }}>
          {formatarNota(media)}
        </span>
        <span style={{ color: 'var(--cor-texto-suave)' }}>({formatarTotalAvaliacoes(total)})</span>
      </div>

      <div className="mt-6 flex items-end gap-3">
        <p className="text-4xl font-bold" style={{ color: 'var(--cor-laranja-claro)' }}>
          {formatarMoeda(produto.preco)}
        </p>
        <p className="text-xs mb-2" style={{ color: 'var(--cor-texto-suave)' }}>
          produção sob demanda
        </p>
      </div>
    </>
  )
}

export default InfoProduto
