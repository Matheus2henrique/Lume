import { useState } from 'react'

const ESTILO_INPUT = {
  background: 'var(--cor-fundo)',
  color: 'var(--cor-texto)',
  border: '1px solid var(--cor-borda)',
}

function ContaLogada({
  usuario,
  erro,
  carregando,
  confirmandoExclusao,
  confirmacaoExclusao,
  setConfirmacaoExclusao,
  onIniciarExclusao,
  onCancelarExclusao,
  onExcluirConta,
  onAlterarNome,
  onAlterarSenha,
  onSair,
  onVoltar,
  onMostrarAdmin,
}) {
  // Edição do nome (só UI local; a gravação é do Perfil via onAlterarNome).
  const [editandoNome, setEditandoNome] = useState(false)
  const [nomeTemp, setNomeTemp] = useState('')
  const [erroNome, setErroNome] = useState('')
  const [sucessoNome, setSucessoNome] = useState('')
  const [salvandoNome, setSalvandoNome] = useState(false)

  // Troca de senha da conta logada.
  const [formSenhaAberto, setFormSenhaAberto] = useState(false)
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarNova, setConfirmarNova] = useState('')
  const [erroSenha, setErroSenha] = useState('')
  const [sucessoSenha, setSucessoSenha] = useState('')
  const [salvandoSenha, setSalvandoSenha] = useState(false)

  function iniciarEdicaoNome() {
    setNomeTemp(usuario.nome || '')
    setErroNome('')
    setSucessoNome('')
    setEditandoNome(true)
  }

  async function salvarNome() {
    const limpo = nomeTemp.trim()
    if (!limpo) {
      setErroNome('Informe seu nome.')
      return
    }
    setErroNome('')
    setSucessoNome('')
    setSalvandoNome(true)
    try {
      await onAlterarNome(limpo)
      setEditandoNome(false)
      setSucessoNome('Nome atualizado com sucesso.')
    } catch (err) {
      setErroNome(err.message)
    } finally {
      setSalvandoNome(false)
    }
  }

  function alternarFormSenha() {
    setFormSenhaAberto((aberto) => !aberto)
    setErroSenha('')
    setSucessoSenha('')
    setSenhaAtual('')
    setNovaSenha('')
    setConfirmarNova('')
  }

  async function salvarSenha() {
    if (!senhaAtual || !novaSenha || !confirmarNova) {
      setErroSenha('Preencha os três campos de senha.')
      return
    }
    if (novaSenha.length < 6) {
      setErroSenha('A nova senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (novaSenha !== confirmarNova) {
      setErroSenha('A confirmação não coincide com a nova senha.')
      return
    }
    setErroSenha('')
    setSucessoSenha('')
    setSalvandoSenha(true)
    try {
      await onAlterarSenha({ senhaAtual, novaSenha })
      setSenhaAtual('')
      setNovaSenha('')
      setConfirmarNova('')
      setFormSenhaAberto(false)
      setSucessoSenha('Senha alterada com sucesso. As outras sessões foram desconectadas.')
    } catch (err) {
      setErroSenha(err.message)
    } finally {
      setSalvandoSenha(false)
    }
  }

  return (
    <section className="py-[70px] flex justify-center px-6" style={{ background: 'var(--cor-fundo)' }}>
      <div className="w-full max-w-md">
        <h2 className="text-4xl font-[Georgia,serif] mb-2 text-center" style={{ color: 'var(--cor-texto)' }}>
          Olá, {usuario.nome || 'leitor(a)'}!
        </h2>
        <p className="text-center mb-8" style={{ color: 'var(--cor-texto-suave)' }}>
          Seja Bem-Vindo!
        </p>

        <div className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: 'var(--cor-fundo-cartao)', border: '1px solid var(--cor-borda)' }}>
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs mb-1" style={{ color: 'var(--cor-texto-suave)' }}>Nome</p>
              {!editandoNome && (
                <button
                  type="button"
                  onClick={iniciarEdicaoNome}
                  className="bg-transparent border-none cursor-pointer text-xs hover:underline p-0"
                  style={{ color: 'var(--cor-laranja)' }}
                >
                  Editar
                </button>
              )}
            </div>

            {editandoNome ? (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={nomeTemp}
                  onChange={(e) => setNomeTemp(e.target.value)}
                  placeholder="Seu nome"
                  autoFocus
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={ESTILO_INPUT}
                />
                {erroNome && <p className="text-xs" style={{ color: 'var(--cor-perigo)' }}>{erroNome}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={salvarNome}
                    disabled={salvandoNome || !nomeTemp.trim()}
                    className="px-4 py-2 rounded-full text-sm text-white cursor-pointer border-none disabled:opacity-60"
                    style={{ background: 'var(--cor-laranja)' }}
                  >
                    {salvandoNome ? 'Salvando…' : 'Salvar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditandoNome(false)}
                    className="px-4 py-2 rounded-full text-sm bg-transparent cursor-pointer"
                    style={{ color: 'var(--cor-texto)' }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <p className="font-medium" style={{ color: 'var(--cor-texto)' }}>{usuario.nome || '—'}</p>
            )}
            {sucessoNome && (
              <p className="text-xs mt-1" style={{ color: 'var(--cor-laranja-claro)' }}>{sucessoNome}</p>
            )}
          </div>

          <div>
            <p className="text-xs mb-1" style={{ color: 'var(--cor-texto-suave)' }}>E-mail</p>
            <p className="font-medium" style={{ color: 'var(--cor-texto)' }}>{usuario.email}</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl p-6 flex flex-col gap-4" style={{ background: 'var(--cor-fundo-cartao)', border: '1px solid var(--cor-borda)' }}>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--cor-texto-suave)' }}>Senha</p>
              <p className="font-medium" style={{ color: 'var(--cor-texto)' }}>••••••••</p>
            </div>
            <button
              type="button"
              onClick={alternarFormSenha}
              className="bg-transparent border-none cursor-pointer text-xs hover:underline p-0"
              style={{ color: 'var(--cor-laranja)' }}
            >
              {formSenhaAberto ? 'Fechar' : 'Alterar senha'}
            </button>
          </div>

          {sucessoSenha && (
            <p className="text-xs" style={{ color: 'var(--cor-laranja-claro)' }}>{sucessoSenha}</p>
          )}

          {formSenhaAberto && (
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--cor-texto-suave)' }}>Senha atual</p>
                <input
                  type="password"
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  placeholder="Sua senha atual"
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={ESTILO_INPUT}
                />
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--cor-texto-suave)' }}>Nova senha</p>
                <input
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={ESTILO_INPUT}
                />
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--cor-texto-suave)' }}>Confirmar nova senha</p>
                <input
                  type="password"
                  value={confirmarNova}
                  onChange={(e) => setConfirmarNova(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={ESTILO_INPUT}
                />
              </div>

              <button
                type="button"
                onClick={salvarSenha}
                disabled={salvandoSenha}
                className="px-4 py-2 rounded-full text-sm text-white cursor-pointer border-none disabled:opacity-60"
                style={{ background: 'var(--cor-laranja)' }}
              >
                {salvandoSenha ? 'Salvando…' : 'Salvar nova senha'}
              </button>
              {erroSenha && <p className="text-xs" style={{ color: 'var(--cor-perigo)' }}>{erroSenha}</p>}
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-3">
          {usuario.admin && (
            <button
              onClick={() => onMostrarAdmin?.()}
              className="border-none px-[30px] py-3 rounded-full text-white cursor-pointer text-lg transition-all duration-300 hover:scale-105"
              style={{ background: 'var(--cor-laranja)' }}
            >
              Painel Admin
            </button>
          )}
          <button
            onClick={onSair}
            className="border-none px-[30px] py-3 rounded-full bg-transparent cursor-pointer text-base transition-all duration-300 hover:underline"
            style={{ color: 'var(--cor-texto)', border: '1px solid var(--cor-laranja)' , background: 'var(--cor-laranja)' }}
          >
            Sair da conta
          </button>
          <button
            onClick={onVoltar}
            className="border-none px-[30px] py-3 rounded-full bg-transparent cursor-pointer text-base transition-all duration-300 hover:underline"
            style={{ color: 'var(--cor-texto)' }}
          >
            Voltar
</button>
        </div>

        {!usuario.admin && (
          <div
            className="mt-8 rounded-2xl p-5 flex flex-col gap-3"
            style={{ background: 'var(--cor-fundo-cartao)', border: '1px solid var(--cor-borda)' }}
          >
            {!confirmandoExclusao ? (
              <>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--cor-texto-suave)' }}>
                  Ao excluir, sua conta e seus dados pessoais são removidos. Seus pedidos ficam
                  apenas como registro fiscal, sem nome, e-mail ou endereço.
                </p>
                <button
                  onClick={onIniciarExclusao}
                  className="px-4 py-2 rounded-full text-sm cursor-pointer bg-transparent transition-all duration-300 hover:underline"
                  style={{ color: '#ef4444', border: '1px solid #ef4444' }}
                >
                  Excluir minha conta
                </button>
              </>
            ) : (
              <>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--cor-texto-suave)' }}>
                  Esta ação é permanente. Digite <strong>{usuario.email}</strong> para confirmar.
                </p>
                <input
                  type="email"
                  value={confirmacaoExclusao}
                  onChange={(e) => setConfirmacaoExclusao(e.target.value)}
                  placeholder="Seu e-mail"
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={ESTILO_INPUT}
                />
                {erro && <p className="text-xs" style={{ color: '#ef4444' }}>{erro}</p>}
                <div className="flex gap-3">
                  <button
                    onClick={onExcluirConta}
                    disabled={carregando}
                    className="px-4 py-2 rounded-full text-sm text-white cursor-pointer border-none disabled:opacity-60"
                    style={{ background: '#ef4444' }}
                  >
                    {carregando ? 'Excluindo…' : 'Excluir definitivamente'}
                  </button>
                  <button
                    onClick={onCancelarExclusao}
                    className="px-4 py-2 rounded-full text-sm bg-transparent cursor-pointer"
                    style={{ color: 'var(--cor-texto)' }}
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export default ContaLogada
