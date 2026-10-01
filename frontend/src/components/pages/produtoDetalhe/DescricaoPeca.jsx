function DescricaoPeca({ produto }) {
  return (
    <div
      className="mt-14 rounded-[18px] p-8"
      style={{ background: 'var(--cor-fundo-cartao)', border: '1px solid var(--cor-borda)' }}
    >
      <h2 className="text-2xl font-[Georgia,serif] mb-4" style={{ color: 'var(--cor-texto)' }}>
        Descrição da peça
      </h2>
      <p className="leading-relaxed whitespace-pre-line" style={{ color: 'var(--cor-texto)' }}>
        {produto.descricao}
      </p>
      <p className="mt-4 text-sm" style={{ color: 'var(--cor-texto-suave)' }}>
        Cada peça é impressa e revisada à mão antes do envio. Enviamos para todo o Brasil.
      </p>
    </div>
  )
}

export default DescricaoPeca
