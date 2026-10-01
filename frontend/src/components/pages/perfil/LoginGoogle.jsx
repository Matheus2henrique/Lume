import IconeGoogle from './IconeGoogle'

function LoginGoogle({ oculto, onEntrar }) {
  return (
    <>
      <div className="my-7 flex items-center gap-4" style={oculto ? { display: 'none' } : undefined}>
        <span className="h-px flex-1" style={{ background: 'var(--cor-borda)' }} />
        <span className="text-sm whitespace-nowrap" style={{ color: 'var(--cor-texto-suave)' }}>
          Entrar com outras contas
        </span>
        <span className="h-px flex-1" style={{ background: 'var(--cor-borda)' }} />
      </div>

      <button
        type="button"
        onClick={onEntrar}
        className="w-full flex items-center justify-center gap-3 py-3 rounded-full cursor-pointer transition-all duration-300 hover:scale-[1.02]"
        style={{
          background: 'var(--cor-fundo-cartao)',
          border: '1px solid var(--cor-borda)',
          color: 'var(--cor-texto)',
          display: oculto ? 'none' : 'flex',
        }}
      >
        <IconeGoogle />
        <span className="text-base font-medium">Continuar com o Google</span>
      </button>
    </>
  )
}

export default LoginGoogle
