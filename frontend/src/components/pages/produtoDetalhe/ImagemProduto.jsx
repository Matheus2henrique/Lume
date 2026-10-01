function ImagemProduto({ produto }) {
  return (
    <div className="flex-1">
      <div
        className="rounded-[18px] p-4"
        style={{ background: 'var(--cor-fundo-cartao)', border: '1px solid var(--cor-borda)' }}
      >
        <div className="relative overflow-hidden rounded-[14px]"
          style={{ background: 'var(--cor-fundo-suave)' }}
        >
          <img src={produto.imagem} alt={produto.nome} className="w-full h-[320px] md:h-[440px] object-cover" />
          <span
            className="absolute bottom-4 right-4 text-white text-xs px-3 py-1.5 rounded-full"
            style={{ background: 'var(--cor-laranja)' }}
          >
            {produto.tipo === 'colecionavel' ? 'Colecionável' : 'Decoração avulsa'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default ImagemProduto
