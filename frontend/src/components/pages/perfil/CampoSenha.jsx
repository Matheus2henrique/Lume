import { estiloInput } from './estilos'

function CampoSenha({
  rotulo,
  placeholder,
  valor,
  onChange,
  mostrarSenha,
  onAlternar,
  obrigatorio,
  minLength,
}) {
  return (
    <div className="text-left">
      <label className="text-sm mb-1 block" style={{ color: 'var(--cor-texto-suave)' }}>
        {rotulo}
      </label>
      <div className="relative">
        <input
          type={mostrarSenha ? 'text' : 'password'}
          placeholder={placeholder}
          {...(obrigatorio ? { required: true } : {})}
          {...(minLength !== undefined ? { minLength } : {})}
          value={valor}
          onChange={onChange}
          className="w-full border rounded-lg px-4 py-3 pr-11 text-base outline-none transition-colors"
          style={estiloInput}
        />
        <button
          type="button"
          onClick={onAlternar}
          className="absolute right-3 top-1/2 -translate-y-1/2 border-none bg-transparent cursor-pointer p-1"
          style={{ color: 'var(--cor-texto-suave)' }}
          tabIndex={-1}
          aria-label={mostrarSenha ? 'Esconder senha' : 'Mostrar senha'}
        >
          {mostrarSenha ? (
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

export default CampoSenha
