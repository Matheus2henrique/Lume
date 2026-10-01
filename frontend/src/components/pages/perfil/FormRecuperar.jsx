import Campo from './Campo'

function FormRecuperar({ email, setEmail, erro, carregando, onSubmit, onVoltarLogin }) {
  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <Campo
        rotulo="Endereço de e-mail"
        type="email"
        placeholder="seu@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      {erro && (
        <p className="text-sm" style={{ color: 'var(--cor-perigo)' }}>
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={carregando}
        className="mt-2 border-none px-[30px] py-3 rounded-full text-white cursor-pointer text-lg transition-all duration-300 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
        style={{ background: 'var(--cor-laranja)' }}
      >
        {carregando ? 'Enviando…' : 'Enviar código'}
      </button>

      <button
        type="button"
        onClick={onVoltarLogin}
        className="bg-transparent border-none cursor-pointer text-sm hover:underline"
        style={{ color: 'var(--cor-texto-suave)' }}
      >
        Voltar ao login
      </button>
    </form>
  )
}

export default FormRecuperar
