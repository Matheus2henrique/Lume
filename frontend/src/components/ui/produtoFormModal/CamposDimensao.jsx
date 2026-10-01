import { ESTILO_INPUT } from './estilos'

const DIMENSOES = [
  { campo: 'peso', rotulo: 'Peso (kg)', passo: '0.001', exemplo: '0,300' },
  { campo: 'altura', rotulo: 'Altura (cm)', passo: '0.01', exemplo: '5' },
  { campo: 'largura', rotulo: 'Largura (cm)', passo: '0.01', exemplo: '20' },
  { campo: 'comprimento', rotulo: 'Comprimento (cm)', passo: '0.01', exemplo: '20' },
]

function CamposDimensao({ form, setForm }) {
  return (
    <div>
      <label className="text-xs mb-2 block" style={{ color: 'var(--cor-texto-suave)' }}>
        Dimensões para o frete
      </label>
      <div className="grid grid-cols-2 gap-4">
        {DIMENSOES.map((d) => (
          <div key={d.campo}>
            <label className="text-xs mb-1 block" style={{ color: 'var(--cor-texto-suave)' }}>{d.rotulo}</label>
            <input
              type="number"
              step={d.passo}
              min="0"
              value={form[d.campo]}
              onChange={(e) => setForm({ ...form, [d.campo]: e.target.value })}
              className="w-full border rounded-lg px-4 py-2.5 text-sm outline-none"
              style={ESTILO_INPUT}
              placeholder={d.exemplo}
            />
          </div>
        ))}
      </div>
      <p className="text-xs mt-1" style={{ color: 'var(--cor-texto-suave)' }}>
        Deixe vazio para usar as medidas padrão na cotação.
      </p>
    </div>
  )
}

export default CamposDimensao
