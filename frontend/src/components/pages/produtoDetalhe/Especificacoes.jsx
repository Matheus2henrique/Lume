import { Check, Download, Camada, Relogio } from '../../ui/Icones'

function Especificacoes({ permiteUpload }) {
  const specs = [
    { icone: <Download className="w-5 h-5" />, label: 'Arquivo', valor: permiteUpload ? 'Você envia o seu' : 'Modelo pronto' },
    { icone: <Camada className="w-5 h-5" />, label: 'Acabamento', valor: 'Alta qualidade' },
    { icone: <Relogio className="w-5 h-5" />, label: 'Produção', valor: '5 a 10 dias' },
    { icone: <Check className="w-5 h-5" />, label: 'Garantia', valor: 'Revisão manual' },
  ]

  return (
    <div className="mt-6 grid grid-cols-2 gap-3">
      {specs.map((spec) => (
        <div
          key={spec.label}
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ background: 'var(--cor-fundo-suave)' }}
        >
          <span style={{ color: 'var(--cor-laranja-claro)' }}>{spec.icone}</span>
          <div>
            <p className="text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
              {spec.label}
            </p>
            <p className="text-sm font-semibold" style={{ color: 'var(--cor-texto)' }}>
              {spec.valor}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default Especificacoes
