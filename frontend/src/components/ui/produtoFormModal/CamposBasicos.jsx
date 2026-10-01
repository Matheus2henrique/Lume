import { ESTILO_INPUT } from './estilos'

function CamposBasicos({ form, setForm, nichos }) {
  return (
    <>
      <div>
        <label className="text-xs mb-1 block" style={{ color: 'var(--cor-texto-suave)' }}>Nome do produto*</label>
        <input
          type="text"
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
          className="w-full border rounded-lg px-4 py-2.5 text-sm outline-none"
          style={ESTILO_INPUT}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs mb-1 block" style={{ color: 'var(--cor-texto-suave)' }}>Nicho*</label>
          <select
            value={form.genero}
            onChange={(e) => setForm({ ...form, genero: e.target.value })}
            className="w-full border rounded-lg px-4 py-2.5 text-sm outline-none appearance-none cursor-pointer"
            style={ESTILO_INPUT}
            required
          >
            <option value="">Selecione</option>
            {nichos.map((n) => (
              <option key={n.id} value={n.id}>{n.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs mb-1 block" style={{ color: 'var(--cor-texto-suave)' }}>Tipo</label>
          <select
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            className="w-full border rounded-lg px-4 py-2.5 text-sm outline-none appearance-none cursor-pointer"
            style={ESTILO_INPUT}
          >
            <option value="decoracao">Decoração</option>
            <option value="colecionavel">Colecionável</option>
          </select>
        </div>
      </div>
    </>
  )
}

export default CamposBasicos
