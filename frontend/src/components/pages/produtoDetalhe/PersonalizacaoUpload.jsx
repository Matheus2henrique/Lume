import { Check } from '../../ui/Icones'

function PersonalizacaoUpload({ produto, arquivo, erroArquivo, onSelecionarArquivo, onRemoverArquivo }) {
  if (!produto.permiteUpload) return null

  return (
    <div
      className="mt-6 rounded-2xl p-5"
      style={{ border: `1px dashed var(--cor-primaria)`, background: 'var(--cor-primaria-suave)' }}
    >
      <p className="text-sm font-medium" style={{ color: 'var(--cor-texto)' }}>
        Personalize esta peça
      </p>
      <p className="mt-1 text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
        Envie o arquivo com a frase, nome, imagem ou logo que você quer na peça.
      </p>
      <label
        className="mt-3 inline-block px-4 py-2 rounded-lg text-white text-sm font-medium cursor-pointer"
        style={{ background: 'var(--cor-primaria)' }}
      >
        {arquivo ? 'Trocar arquivo' : 'Escolher arquivo'}
        <input type="file" className="hidden" onChange={onSelecionarArquivo} accept=".png,.jpg,.jpeg,.svg,.pdf,.stl" />
      </label>
      {arquivo && (
        <p className="mt-3 text-xs flex items-center gap-2" style={{ color: 'var(--cor-primaria)' }}>
          <Check className="w-4 h-4 shrink-0" />
          <span className="truncate">{arquivo.nome}</span>
          <button
            type="button"
            onClick={onRemoverArquivo}
            className="bg-transparent border-none cursor-pointer text-xs underline shrink-0"
            style={{ color: 'var(--cor-perigo)' }}
          >
            Remover
          </button>
        </p>
      )}
      {erroArquivo && (
        <p className="mt-3 text-xs" style={{ color: 'var(--cor-perigo)' }}>
          {erroArquivo}
        </p>
      )}
    </div>
  )
}

export default PersonalizacaoUpload
