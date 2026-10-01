import CampoCodigo from './CampoCodigo'
import CampoSenha from './CampoSenha'

function FormRedefinir({
  codigo,
  setCodigo,
  senha,
  setSenha,
  mostrarSenha,
  onAlternarSenha,
  erro,
  carregando,
  cooldown,
  onSubmit,
  onReenviar,
  onVoltarLogin,
}) {
  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <CampoCodigo
        rotulo="Código recebido por e-mail"
        valor={codigo}
        onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
      />

      <CampoSenha
        rotulo="Nova senha"
        placeholder="Crie uma senha (mínimo 6 caracteres)"
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

      <button
        type="submit"
        disabled={carregando || codigo.length < 4}
        className="mt-2 border-none px-[30px] py-3 rounded-full text-white cursor-pointer text-lg transition-all duration-300 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
        style={{ background: 'var(--cor-laranja)' }}
      >
        {carregando ? 'Salvando…' : 'Redefinir senha'}
      </button>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onReenviar}
          disabled={cooldown > 0 || carregando}
          className="bg-transparent border-none cursor-pointer text-sm hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ color: 'var(--cor-laranja)' }}
        >
          {cooldown > 0 ? `Reenviar em ${cooldown}s` : 'Reenviar código'}
        </button>
        <button
          type="button"
          onClick={onVoltarLogin}
          className="bg-transparent border-none cursor-pointer text-sm hover:underline"
          style={{ color: 'var(--cor-texto-suave)' }}
        >
          Voltar ao login
        </button>
      </div>
    </form>
  )
}

export default FormRedefinir
