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
  onSair,
  onVoltar,
  onMostrarAdmin,
}) {
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
            <p className="text-xs mb-1" style={{ color: 'var(--cor-texto-suave)' }}>Nome</p>
            <p className="font-medium" style={{ color: 'var(--cor-texto)' }}>{usuario.nome || '—'}</p>
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: 'var(--cor-texto-suave)' }}>E-mail</p>
            <p className="font-medium" style={{ color: 'var(--cor-texto)' }}>{usuario.email}</p>
          </div>
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
                  style={{
                    background: 'var(--cor-fundo)',
                    color: 'var(--cor-texto)',
                    border: '1px solid var(--cor-borda)',
                  }}
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
