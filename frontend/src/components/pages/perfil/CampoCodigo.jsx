import { estiloInput } from './estilos'

function CampoCodigo({ rotulo, valor, onChange }) {
  return (
    <div className="text-left">
      <label className="text-sm mb-1 block" style={{ color: 'var(--cor-texto-suave)' }}>
        {rotulo}
      </label>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="0000"
        value={valor}
        onChange={onChange}
        className="w-full border rounded-lg px-4 py-3 text-base outline-none transition-colors text-center tracking-[0.5em]"
        style={estiloInput}
      />
    </div>
  )
}

export default CampoCodigo
