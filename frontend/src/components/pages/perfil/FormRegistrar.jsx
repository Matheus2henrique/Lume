import Campo from './Campo'
import CampoSenha from './CampoSenha'

function FormRegistrar({
  nome,
  setNome,
  email,
  setEmail,
  senha,
  setSenha,
  mostrarSenha,
  onAlternarSenha,
  erro,
  carregando,
  onSubmit,
}) {
  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <Campo
        rotulo="Nome*"
        type="text"
        placeholder="Seu nome"
        required
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />

      <Campo
        rotulo="Endereço de e-mail*"
        type="email"
        placeholder="seu@email.com"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <CampoSenha
        rotulo="Senha*"
        placeholder="Crie uma senha (mínimo 6 caracteres)"
        valor={senha}
        onChange={(e) => setSenha(e.target.value)}
        mostrarSenha={mostrarSenha}
        onAlternar={onAlternarSenha}
        obrigatorio
        minLength={6}
      />

      <button
        type="submit"
        disabled={carregando || !nome.trim() || !email.trim() || !senha.trim()}
        className="mt-2 border-none px-[30px] py-3 rounded-full text-white cursor-pointer text-lg transition-all duration-300 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
        style={{ background: 'var(--cor-laranja)' }}
      >
        {carregando ? 'Criando…' : 'Criar conta'}
      </button>

      {erro && (
        <p className="text-sm text-center" style={{ color: 'var(--cor-perigo)' }}>
          {erro}
        </p>
      )}
    </form>
  )
}

export default FormRegistrar
