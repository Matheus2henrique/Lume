import { ESTILO_INPUT } from './estilos'

function CamposBasicos({ form, setForm, nichos, subcategorias = {} }) {
  // Subpasta só existe dentro do nicho escolhido: trocar de nicho limpa o campo.
  const subsDoNicho = form.genero ? subcategorias[form.genero] || [] : []

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
            onChange={(e) => setForm({ ...form, genero: e.target.value, subcategoria: '' })}
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

      {form.genero && (
        <div>
          <label className="text-xs mb-1 block" style={{ color: 'var(--cor-texto-suave)' }}>Subpasta do nicho</label>
          <select
            value={form.subcategoria || ''}
            onChange={(e) => setForm({ ...form, subcategoria: e.target.value })}
            className="w-full border rounded-lg px-4 py-2.5 text-sm outline-none appearance-none cursor-pointer"
            style={ESTILO_INPUT}
          >
            <option value="">— Sem subpasta (aparece só em TODOS) —</option>
            {subsDoNicho.map((s) => (
              <option key={s.id} value={s.id}>{s.nome}</option>
            ))}
          </select>
          {subsDoNicho.length === 0 && (
            <p className="text-xs mt-1" style={{ color: 'var(--cor-texto-suave)' }}>
              Este nicho ainda não tem subpastas — crie na aba Subpastas do painel.
            </p>
          )}
        </div>
      )}
    </>
  )
}

export default CamposBasicos
