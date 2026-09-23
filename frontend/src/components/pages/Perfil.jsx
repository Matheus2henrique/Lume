import { useState, useEffect } from 'react'
import { api, obterToken, obterUsuario, salvarSessao, limparSessao } from '../../api'

// Crie um Client ID OAuth no Google Cloud Console
// (APIs e serviços > Credenciais > Criar credenciais > ID do cliente OAuth > App da Web)
// e cole aqui. Redirect URI configurada: origem = http://localhost:5173
const GOOGLE_CLIENT_ID = 'SEU_CLIENT_ID_AQUI.apps.googleusercontent.com'

function carregarGoogleIdentity() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts) return resolve(window.google.accounts)
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve(window.google.accounts)
    script.onerror = () => reject(new Error('Não foi possível carregar o login do Google.'))
    document.head.appendChild(script)
  })
}

function IconeGoogle({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2C36.9 40.2 44 35 44 24c0-1.3-.1-2.6-.4-3.9z" />
    </svg>
  )
}

function Perfil({ onVoltar, onMostrarAdmin, onAdminLogin, onAdminLogout }) {
  const [modo, setModo] = useState('login') // login | registrar | verificar
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [codigo, setCodigo] = useState('')
  const [envioPendente, setEnvioPendente] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [usuario, setUsuario] = useState(null)

  const estiloInput = {
    borderColor: 'var(--cor-borda)',
    color: 'var(--cor-texto)',
    background: 'var(--cor-fundo-cartao)',
  }

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  useEffect(() => {
    async function carregarSessao() {
      const salvo = obterUsuario()
      if (!salvo) return
      setUsuario(salvo)
      if (salvo.admin) {
        onAdminLogin?.()
        return
      }
      try {
        const { usuario: doBanco } = await api.perfil()
        setUsuario(doBanco)
        salvarSessao({ token: obterToken(), usuario: doBanco })
      } catch {
        limparSessao()
        setUsuario(null)
      }
    }
    carregarSessao()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function concluirLogin(resposta) {
    salvarSessao(resposta)
    setUsuario(resposta.usuario)
    setSucesso(`Bem-vindo(a), ${resposta.usuario.nome || resposta.usuario.email}!`)
    setErro('')
    setTimeout(() => onVoltar(), 900)
  }

  async function handleLogin(e) {
    e.preventDefault()
    if (!email.trim() || !senha.trim()) {
      setErro('Preencha o e-mail e a senha para entrar.')
      return
    }
    setErro('')
    setSucesso('')
    setCarregando(true)
    try {
      const resposta = await api.login({ email, senha })
      concluirLogin(resposta)
    } catch (err) {
      if (err.dados?.requerVerificacao) {
        setErro('')
        setCodigo('')
        setModo('verificar')
        setSucesso(err.dados.erro || 'Confirme o código enviado para o seu e-mail.')
        return
      }
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  async function handleRegistrar(e) {
    e.preventDefault()
    if (!email.trim() || !senha.trim()) {
      setErro('Preencha o e-mail e a senha para criar sua conta.')
      return
    }
    setErro('')
    setSucesso('')
    setCarregando(true)
    try {
      const resposta = await api.registrar({ nome, email, senha })
      if (resposta.requerVerificacao) {
        iniciarVerificacao(resposta)
        return
      }
      concluirLogin(resposta)
    } catch (err) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  function iniciarVerificacao(resposta) {
    setCodigo('')
    setModo('verificar')
    setCooldown(60)
    setEnvioPendente(resposta.emailEnviado === false)
    setErro('')
    setSucesso(
      `Enviamos um código de verificação para ${resposta.email || email}. Ele expira em ${resposta.expiraEmMinutos || 10} minutos.`
    )
  }

  async function handleVerificar(e) {
    e.preventDefault()
    if (!codigo.trim()) {
      setErro('Digite o código recebido por e-mail.')
      return
    }
    setErro('')
    setSucesso('')
    setCarregando(true)
    try {
      const resposta = await api.verificarCodigo({ email, codigo: codigo.trim() })
      concluirLogin(resposta)
    } catch (err) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  async function handleReenviar() {
    if (cooldown > 0 || carregando) return
    setErro('')
    setSucesso('')
    setCarregando(true)
    try {
      const resposta = await api.reenviarVerificacao({ email })
      setCooldown(60)
      setEnvioPendente(false)
      setSucesso(resposta.mensagem || 'Novo código enviado.')
    } catch (err) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  function handleSair() {
    limparSessao()
    setUsuario(null)
    setSucesso('')
    setErro('')
    onAdminLogout?.()
  }

  async function handleGoogleLogin() {
    try {
      const accounts = await carregarGoogleIdentity()

      if (GOOGLE_CLIENT_ID.startsWith('SEU_CLIENT_ID')) {
        setErro('Configure o GOOGLE_CLIENT_ID no código para habilitar o login com o Google.')
        return
      }

      setErro('')
      const client = accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'email profile openid',
        callback: (resposta) => {
          if (resposta?.error) {
            if (resposta.error === 'user_cancelled' || resposta.error === 'access_denied') return
            setErro('Não foi possível entrar com o Google. Tente novamente.')
            return
          }
          setSucesso('Login com o Google ainda requer integração no backend.')
        },
      })

      client.requestAccessToken({ prompt: 'select_account' })
    } catch (err) {
      setErro(err.message || 'Não foi possível entrar com o Google.')
    }
  }

  if (usuario) {
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
              onClick={handleSair}
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
        </div>
      </section>
    )
  }

  return (
    <section className="py-[70px] flex justify-center px-6" style={{ background: 'var(--cor-fundo)' }}>
      <div className="w-full max-w-md">
        <h2 className="text-4xl font-[Georgia,serif] mb-2 text-center" style={{ color: 'var(--cor-texto)' }}>
          {modo === 'login' ? 'Entrar' : modo === 'registrar' ? 'Registrar' : 'Verificar e-mail'}
        </h2>
        <p className="text-center mb-8" style={{ color: 'var(--cor-texto-suave)' }}>
          {modo === 'login'
            ? 'Acesse sua conta Lume para continuar.'
            : modo === 'registrar'
              ? 'Crie sua conta para começar a comprar.'
              : `Digite o código que enviamos para ${email}.`}
        </p>

        {sucesso && (
          <p
            className="mb-6 text-center text-sm py-2 px-4 rounded-lg"
            style={{ background: 'var(--cor-primaria-suave)', color: 'var(--cor-primaria)' }}
          >
            {sucesso}
          </p>
        )}

        {modo === 'verificar' ? (
          <form className="flex flex-col gap-5" onSubmit={handleVerificar}>
            {envioPendente && (
              <p
                className="text-sm py-2 px-4 rounded-lg"
                style={{ background: 'var(--cor-fundo-cartao)', color: 'var(--cor-texto-suave)', border: '1px solid var(--cor-borda)' }}
              >
                O e-mail ainda não chegou? Confira a caixa de spam ou use “Reenviar código”. Em
                desenvolvimento, o código aparece no console do backend.
              </p>
            )}

            <div className="text-left">
              <label className="text-sm mb-1 block" style={{ color: 'var(--cor-texto-suave)' }}>
                Código de verificação
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
                className="w-full border rounded-lg px-4 py-3 text-base outline-none transition-colors text-center tracking-[0.5em]"
                style={estiloInput}
              />
            </div>

            {erro && (
              <p className="text-sm" style={{ color: 'var(--cor-perigo)' }}>
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={carregando || codigo.length !== 6}
              className="mt-2 border-none px-[30px] py-3 rounded-full text-white cursor-pointer text-lg transition-all duration-300 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ background: 'var(--cor-laranja)' }}
            >
              {carregando ? 'Verificando…' : 'Confirmar'}
            </button>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleReenviar}
                disabled={cooldown > 0 || carregando}
                className="bg-transparent border-none cursor-pointer text-sm hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ color: 'var(--cor-laranja)' }}
              >
                {cooldown > 0 ? `Reenviar em ${cooldown}s` : 'Reenviar código'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setModo('login')
                  setErro('')
                  setSucesso('')
                  setCodigo('')
                }}
                className="bg-transparent border-none cursor-pointer text-sm hover:underline"
                style={{ color: 'var(--cor-texto-suave)' }}
              >
                Voltar ao login
              </button>
            </div>
          </form>
        ) : modo === 'login' ? (
          <form className="flex flex-col gap-5" onSubmit={handleLogin}>
            <div className="text-left">
              <label className="text-sm mb-1 block" style={{ color: 'var(--cor-texto-suave)' }}>
                Endereço de e-mail
              </label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-lg px-4 py-3 text-base outline-none transition-colors"
                style={estiloInput}
              />
            </div>

            <div className="text-left">
              <label className="text-sm mb-1 block" style={{ color: 'var(--cor-texto-suave)' }}>
                Senha
              </label>
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  placeholder="Sua senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full border rounded-lg px-4 py-3 pr-11 text-base outline-none transition-colors"
                  style={estiloInput}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
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
              <button type="button" className="bg-transparent border-none cursor-pointer text-sm hover:underline" style={{ color: 'var(--cor-laranja)' }}>
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
        ) : (
          <form className="flex flex-col gap-5" onSubmit={handleRegistrar}>
            <div className="text-left">
              <label className="text-sm mb-1 block" style={{ color: 'var(--cor-texto-suave)' }}>
                Nome
              </label>
              <input
                type="text"
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full border rounded-lg px-4 py-3 text-base outline-none transition-colors"
                style={estiloInput}
              />
            </div>

            <div className="text-left">
              <label className="text-sm mb-1 block" style={{ color: 'var(--cor-texto-suave)' }}>
                Endereço de e-mail*
              </label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-lg px-4 py-3 text-base outline-none transition-colors"
                style={estiloInput}
              />
            </div>

            <div className="text-left">
              <label className="text-sm mb-1 block" style={{ color: 'var(--cor-texto-suave)' }}>
                Senha*
              </label>
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  placeholder="Crie uma senha (mínimo 6 caracteres)"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full border rounded-lg px-4 py-3 pr-11 text-base outline-none transition-colors"
                  style={estiloInput}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
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
              {carregando ? 'Criando…' : 'Criar conta'}
            </button>
          </form>
        )}

        <div className="my-7 flex items-center gap-4" style={modo === 'verificar' ? { display: 'none' } : undefined}>
          <span className="h-px flex-1" style={{ background: 'var(--cor-borda)' }} />
          <span className="text-sm whitespace-nowrap" style={{ color: 'var(--cor-texto-suave)' }}>
            Entrar com outras contas
          </span>
          <span className="h-px flex-1" style={{ background: 'var(--cor-borda)' }} />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-full cursor-pointer transition-all duration-300 hover:scale-[1.02]"
          style={{
            background: 'var(--cor-fundo-cartao)',
            border: '1px solid var(--cor-borda)',
            color: 'var(--cor-texto)',
            display: modo === 'verificar' ? 'none' : 'flex',
          }}
        >
          <IconeGoogle />
          <span className="text-base font-medium">Continuar com o Google</span>
        </button>

        {modo !== 'verificar' && (
          <p className="mt-6 text-center text-base" style={{ color: 'var(--cor-texto-suave)' }}>
            {modo === 'login' ? (
            <>
              Não tem uma conta?{' '}
              <button
                type="button"
                onClick={() => {
                  setModo('registrar')
                  setErro('')
                }}
                className="bg-transparent border-none cursor-pointer font-semibold hover:underline"
                style={{ color: 'var(--cor-laranja)' }}
              >
                Crie Sua Conta
              </button>
            </>
          ) : (
            <>
              Já tem uma conta?{' '}
              <button
                type="button"
                onClick={() => {
                  setModo('login')
                  setErro('')
                }}
                className="bg-transparent border-none cursor-pointer font-semibold hover:underline"
                style={{ color: 'var(--cor-laranja)' }}
              >
                Faça Login Agora
              </button>
              </>
            )}
          </p>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={onVoltar}
            className="border-none px-[30px] py-3 rounded-full bg-transparent cursor-pointer text-base transition-all duration-300 hover:underline"
            style={{ color: 'var(--cor-texto)' }}
          >
            Voltar
          </button>
        </div>
      </div>
    </section>
  )
}

export default Perfil