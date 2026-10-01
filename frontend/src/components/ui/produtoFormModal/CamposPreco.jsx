import { ESTILO_INPUT } from './estilos'

function CamposPreco({ form, setForm }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="text-xs mb-1 block" style={{ color: 'var(--cor-texto-suave)' }}>Preço (R$)*</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={form.preco}
          onChange={(e) => setForm({ ...form, preco: e.target.value })}
          className="w-full border rounded-lg px-4 py-2.5 text-sm outline-none"
          style={ESTILO_INPUT}
          required
        />
      </div>
      <div>
        <label className="text-xs mb-1 block" style={{ color: 'var(--cor-texto-suave)' }}>Estoque</label>
        <input
          type="number"
          min="0"
          value={form.estoque}
          onChange={(e) => setForm({ ...form, estoque: e.target.value })}
          className="w-full border rounded-lg px-4 py-2.5 text-sm outline-none"
          style={ESTILO_INPUT}
        />
      </div>
    </div>
  )
}

export default CamposPreco
