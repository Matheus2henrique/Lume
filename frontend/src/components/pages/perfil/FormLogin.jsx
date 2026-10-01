import Campo from './Campo'
import CampoSenha from './CampoSenha'

function FormLogin({
  email,
  setEmail,
  senha,
  setSenha,
  mostrarSenha,
  onAlternarSenha,
  erro,
  carregando,
  onSubmit,
  onEsqueciSenha,
}) {
  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <Campo
        rotulo="Endereço de e-mail"
        type="email"
        placeholder="seu@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <CampoSenha
        rotulo="Senha"
        placeholder="Sua senha"
        valor={senha}
        onChange={(e) => setSenha(e.target.value)}
        mostrarSenha={mostrarSenha}
        onAlternar={onAlternarSenha}
      />

      {erro && (
        <p className="text-sm" style={{ color: 'var(--cor-perigo)' }}>
          {erro}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--cor-texto-suave)' }}>
          <input type="checkbox" className="accent-[var(--cor-primaria)] w-4 h-4" />
          Lembrar de mim
        </label>
        <button
          type="button"
          onClick={onEsqueciSenha}
          className="bg-transparent border-none cursor-pointer text-sm hover:underline"
          style={{ color: 'var(--cor-laranja)' }}
        >
          Esqueci minha senha
        </button>
      </div>

      <button
        type="submit"
        disabled={carregando}
        className="mt-2 border-none px-[30px] py-3 rounded-full text-white cursor-pointer text-lg transition-all duration-300 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
        style={{ background: 'var(--cor-laranja)' }}
      >
        {carregando ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  )
}

export default FormLogin
