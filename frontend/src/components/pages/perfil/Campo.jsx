import { estiloInput } from './estilos'

function Campo({ rotulo, ...props }) {
  return (
    <div className="text-left">
      <label className="text-sm mb-1 block" style={{ color: 'var(--cor-texto-suave)' }}>
        {rotulo}
      </label>
      <input
        {...props}
        className="w-full border rounded-lg px-4 py-3 text-base outline-none transition-colors"
        style={estiloInput}
      />
    </div>
  )
}

export default Campo
