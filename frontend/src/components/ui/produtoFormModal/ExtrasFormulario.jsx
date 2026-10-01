import { ESTILO_INPUT } from './estilos'

function ExtrasFormulario({ form, setForm }) {
  return (
    <>
      <div>
        <label className="text-xs mb-1 block" style={{ color: 'var(--cor-texto-suave)' }}>Descrição</label>
        <textarea
          value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          className="w-full border rounded-lg px-4 py-2.5 text-sm outline-none resize-none"
          style={ESTILO_INPUT}
          rows={3}
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: 'var(--cor-texto-suave)' }}>
        <input
          type="checkbox"
          checked={form.permiteUpload}
          onChange={(e) => setForm({ ...form, permiteUpload: e.target.checked })}
          className="accent-[var(--cor-laranja)] w-4 h-4"
        />
        Permite personalização (upload)
      </label>
    </>
  )
}

export default ExtrasFormulario
