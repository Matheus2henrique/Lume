import { useState, useEffect } from 'react'
import { api, obterToken, obterUsuario, salvarSessao, limparSessao } from '../api'

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

function Perfil({ onVoltar }) {
  const [modo, setModo] = useState('login') // login | registrar
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
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
    async function carregarSessao() {
      const salvo = obterUsuario()
      if (!salvo) return
      setUsuario(salvo)
      try {
        // Consulta o perfil mais recente diretamente no banco via /api/auth/perfil
        const { usuario: doBanco } = await api.perfil()
        setUsuario(doBanco)
        salvarSessao({ token: obterToken(), usuario: doBanco })
      } catch {
        // sessão expirada
        limparSessao()
        setUsuario(null)
      }
    }
    carregarSessao()
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
      concluirLogin(resposta)
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
            Sua conta Locus (dados vindos do banco de dados).
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
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--cor-texto-suave)' }}>Provedor</p>
              <p className="font-medium" style={{ color: 'var(--cor-texto)' }}>{usuario.provedor}</p>
            </div>
            <p className="text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
              Conta consultada em <strong>/api/auth/perfil</strong> no banco de dados.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={handleSair}
              className="border-none px-[30px] py-3 rounded-full text-white cursor-pointer text-lg transition-all duration-300 hover:scale-105"
              style={{ background: 'var(--cor-primaria)' }}
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
          {modo === 'login' ? 'Entrar' : 'Registrar'}
        </h2>
        <p className="text-center mb-8" style={{ color: 'var(--cor-texto-suave)' }}>
          {modo === 'login'
            ? 'Acesse sua conta Locus para continuar.'
            : 'Crie sua conta e faça parte do Clube Locus.'}
        </p>

        {sucesso && (
          <p
            className="mb-6 text-center text-sm py-2 px-4 rounded-lg"
            style={{ background: 'var(--cor-primaria-suave)', color: 'var(--cor-primaria)' }}
          >
            {sucesso}
          </p>
        )}

        {modo === 'login' ? (
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
              <input
                type="password"
                placeholder="Sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full border rounded-lg px-4 py-3 text-base outline-none transition-colors"
                style={estiloInput}
              />
            </div>

            {erro && (
              <p className="text-sm" style={{ color: '#e11d48' }}>
                {erro}
              </p>
            )}

            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--cor-texto-suave)' }}>
                <input type="checkbox" className="accent-[var(--cor-primaria)] w-4 h-4" />
                Lembrar de mim
              </label>
              <button type="button" className="bg-transparent border-none cursor-pointer text-sm hover:underline" style={{ color: 'var(--cor-primaria)' }}>
                Esqueci minha senha
              </button>
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="mt-2 border-none px-[30px] py-3 rounded-full text-white cursor-pointer text-lg transition-all duration-300 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ background: 'var(--cor-primaria)' }}
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
              <input
                type="password"
                placeholder="Crie uma senha (mínimo 6 caracteres)"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full border rounded-lg px-4 py-3 text-base outline-none transition-colors"
                style={estiloInput}
              />
            </div>

            {erro && (
              <p className="text-sm" style={{ color: '#e11d48' }}>
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="mt-2 border-none px-[30px] py-3 rounded-full text-white cursor-pointer text-lg transition-all duration-300 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ background: 'var(--cor-primaria)' }}
            >
              {carregando ? 'Criando…' : 'Criar conta'}
            </button>
          </form>
        )}

        <div className="my-7 flex items-center gap-4">
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
          }}
        >
          <IconeGoogle />
          <span className="text-base font-medium">Continuar com o Google</span>
        </button>

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
                style={{ color: 'var(--cor-primaria)' }}
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
                style={{ color: 'var(--cor-primaria)' }}
              >
                Faça Login Agora
              </button>
            </>
          )}
        </p>

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