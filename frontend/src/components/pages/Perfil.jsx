import { useState, useEffect } from 'react'
import { api, obterToken, obterUsuario, salvarSessao, limparSessao } from '../../api'
import ContaLogada from './perfil/ContaLogada'
import FormLogin from './perfil/FormLogin'
import FormRecuperar from './perfil/FormRecuperar'
import FormRegistrar from './perfil/FormRegistrar'
import FormRedefinir from './perfil/FormRedefinir'
import FormVerificar from './perfil/FormVerificar'
import LoginGoogle from './perfil/LoginGoogle'

// Client ID OAuth (tipo Web) do Google Cloud Console — APIs e serviços >
// Credenciais. Fica em frontend/.env como VITE_GOOGLE_CLIENT_ID; a MESMA
// origem autorizada precisa estar no console (ex.: http://localhost:5173).
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

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

function Perfil({ onVoltar, onMostrarAdmin, onAdminLogin, onAdminLogout, modoInicial = 'login', onMudarModo }) {
  // Verificar/recuperar/redefinir são internos desta tela; login e registrar
  // vêm da URL que o App controla (/Lume/login e /Lume/login/criar-conta).
  const [modoInterno, setModoInterno] = useState(null) // verificar | recuperar | redefinir
  const modo = modoInterno ?? (modoInicial === 'registrar' ? 'registrar' : 'login')
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
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)
  const [confirmacaoExclusao, setConfirmacaoExclusao] = useState('')

  // Modos com formulário próprio (sem troca para registro/login nem Google).
  const modoComCodigo = modo === 'verificar' || modo === 'recuperar' || modo === 'redefinir'

  // Toda troca de modo passa por aqui: login/registrar são ditados pela URL
  // (o App leva para /Lume/login/criar-conta ou /Lume/login); os demais modos
  // ficam internos e sobrevivem ao voltar/avançar do navegador.
  function mudarModo(novo) {
    setModoInterno(novo === 'login' || novo === 'registrar' ? null : novo)
    onMudarModo?.(novo)
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

  // Sucesso: fica nesta tela mostrando o perfil (ContaLogada) com os dados
  // da pessoa — sem redirecionar para a home.
  function concluirLogin(resposta) {
    salvarSessao(resposta)
    setErro('')
    setSucesso('')
    setUsuario(resposta.usuario)
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
      if (resposta?.requerVerificacao) {
        iniciarVerificacao(resposta)
        return
      }
      concluirLogin(resposta)
    } catch (err) {
      if (err.dados?.requerVerificacao) {
        iniciarVerificacao(err.dados)
        return
      }
      if (tratarContaExpirada(err)) return
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  async function handleRegistrar(e) {
    e.preventDefault()
    if (!nome.trim() || !email.trim() || !senha.trim()) {
      setErro('Preencha nome, e-mail e senha para criar sua conta.')
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
      if (tratarContaExpirada(err)) return
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  function iniciarVerificacao(resposta) {
    setCodigo('')
    mudarModo('verificar')
    setCooldown(60)
    setEnvioPendente(resposta.emailEnviado === false)
    setErro('')
    const destino = resposta.email || email
    const expira = resposta.expiraEmMinutos || 10
    setSucesso(
      resposta.novaConta
        ? `Enviamos um código para ${destino}. Sua conta será criada assim que você confirmar o código (ele expira em ${expira} minutos).`
        : `Enviamos um código de verificação para ${destino}. Ele expira em ${expira} minutos.`
    )
  }

  // Conta pendente removida pelo backend (410): avisa e volta pra home.
  function tratarContaExpirada(err) {
    if (err.status !== 410 && !err.dados?.contaExpirada) return false
    setErro('')
    setSucesso(
      'O prazo de verificação expirou e a conta foi removida. Você será redirecionado para a página inicial…'
    )
    mudarModo('login')
    setNome('')
    setEmail('')
    setSenha('')
    setCodigo('')
    setTimeout(() => onVoltar(), 3000)
    return true
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
      if (tratarContaExpirada(err)) return
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
      if (tratarContaExpirada(err)) return
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
    // Volta pro formulário de login (o modo anterior podia ser 'verificar').
    mudarModo('login')
    onAdminLogout?.()
  }

  function iniciarExclusao() {
    setConfirmandoExclusao(true)
    setErro('')
  }

  function cancelarExclusao() {
    setConfirmandoExclusao(false)
    setConfirmacaoExclusao('')
    setErro('')
  }

  // LGPD: exclusão da conta e dos dados pessoais (pedidos ficam anonimizados).
  async function handleExcluirConta() {
    if (confirmacaoExclusao.trim().toLowerCase() !== String(usuario?.email || '').toLowerCase()) {
      setErro('Digite o e-mail da sua conta para confirmar.')
      return
    }
    setErro('')
    setCarregando(true)
    try {
      await api.excluirDados(confirmacaoExclusao.trim())
      limparSessao()
      setUsuario(null)
      setConfirmandoExclusao(false)
      setConfirmacaoExclusao('')
      setSucesso('Sua conta e seus dados pessoais foram excluídos.')
      onAdminLogout?.()
      onVoltar?.()
    } catch (err) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  // Passo 1 de "esqueci minha senha": pede o código por e-mail.
  // A resposta do backend é sempre genérica (não revela se a conta existe).
  async function handleEsqueciSenha(e) {
    e.preventDefault()
    if (!email.trim()) {
      setErro('Informe o e-mail da sua conta.')
      return
    }
    setErro('')
    setSucesso('')
    setCarregando(true)
    try {
      const resposta = await api.esqueciSenha({ email: email.trim() })
      setCodigo('')
      setSenha('')
      mudarModo('redefinir')
      setCooldown(60)
      setSucesso(resposta.mensagem || 'Se existir uma conta, enviamos um código para o seu e-mail.')
    } catch (err) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  // Reenvia o código de redefinição (mesmo endpoint do passo 1).
  async function handleReenviarReset() {
    if (cooldown > 0 || carregando) return
    setErro('')
    setSucesso('')
    setCarregando(true)
    try {
      const resposta = await api.esqueciSenha({ email: email.trim() })
      setCooldown(60)
      setSucesso(resposta.mensagem || 'Novo código enviado.')
    } catch (err) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  // Passo 2: valida o código e grava a nova senha.
  async function handleRedefinir(e) {
    e.preventDefault()
    if (!codigo.trim()) {
      setErro('Digite o código recebido por e-mail.')
      return
    }
    if (String(senha).length < 6) {
      setErro('A nova senha deve ter pelo menos 6 caracteres.')
      return
    }
    setErro('')
    setSucesso('')
    setCarregando(true)
    try {
      const resposta = await api.redefinirSenha({
        email: email.trim(),
        codigo: codigo.trim(),
        senha,
      })
      mudarModo('login')
      setCodigo('')
      setSenha('')
      setSucesso(resposta.mensagem || 'Senha alterada com sucesso. Faça login com a nova senha.')
    } catch (err) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  async function handleGoogleLogin() {
    try {
      const accounts = await carregarGoogleIdentity()

      if (!GOOGLE_CLIENT_ID) {
        setErro('Configure VITE_GOOGLE_CLIENT_ID no frontend/.env para habilitar o login com o Google.')
        return
      }

      setErro('')
      const client = accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'email profile openid',
        callback: async (resposta) => {
          if (resposta?.error) {
            if (resposta.error === 'user_cancelled' || resposta.error === 'access_denied') return
            setErro('Não foi possível entrar com o Google. Tente novamente.')
            return
          }
          // O backend valida assinatura e audiência do ID token antes de criar
          // a sessão — nunca confiamos no e-mail entregue pelo navegador.
          const credential = resposta.id_token || resposta.credential
          if (!credential) {
            setErro('O Google não devolveu uma credencial de identificação.')
            return
          }
          try {
            const sessao = await api.googleLogin({ credential })
            concluirLogin(sessao)
          } catch (err) {
            setErro(err.message)
          }
        },
      })

      client.requestAccessToken({ prompt: 'select_account' })
    } catch (err) {
      setErro(err.message || 'Não foi possível entrar com o Google.')
    }
  }

  // Trocas de modo embutidas no rodapé do formulário.
  function voltarAoLogin() {
    mudarModo('login')
    setErro('')
    setSucesso('')
    setCodigo('')
  }

  function voltarAoLoginSemCodigo() {
    mudarModo('login')
    setErro('')
    setSucesso('')
  }

  function voltarAoLoginLimpandoSenha() {
    mudarModo('login')
    setErro('')
    setSucesso('')
    setCodigo('')
    setSenha('')
  }

  function irParaRecuperar() {
    mudarModo('recuperar')
    setErro('')
    setSucesso('')
  }

  function irParaRegistrar() {
    mudarModo('registrar')
    setErro('')
  }

  function irParaLogin() {
    mudarModo('login')
    setErro('')
  }

  // Alterações da conta logada: os erros sobem para a ContaLogada exibir.
  async function handleAlterarNome(novoNome) {
    const resposta = await api.atualizarNome(novoNome)
    salvarSessao({ token: obterToken(), usuario: resposta.usuario })
    setUsuario(resposta.usuario)
  }

  async function handleAlterarSenha({ senhaAtual, novaSenha }) {
    // O backend devolve um token novo (as outras sessões caem, esta fica).
    const resposta = await api.alterarSenha({ senhaAtual, novaSenha })
    salvarSessao(resposta)
    setUsuario(resposta.usuario)
  }

  const alternarSenha = () => setMostrarSenha(!mostrarSenha)

  if (usuario) {
    return (
      <ContaLogada
        usuario={usuario}
        erro={erro}
        carregando={carregando}
        confirmandoExclusao={confirmandoExclusao}
        confirmacaoExclusao={confirmacaoExclusao}
        setConfirmacaoExclusao={setConfirmacaoExclusao}
        onIniciarExclusao={iniciarExclusao}
        onCancelarExclusao={cancelarExclusao}
        onExcluirConta={handleExcluirConta}
        onAlterarNome={handleAlterarNome}
        onAlterarSenha={handleAlterarSenha}
        onSair={handleSair}
        onVoltar={onVoltar}
        onMostrarAdmin={onMostrarAdmin}
      />
    )
  }

  return (
    <section className="py-[70px] flex justify-center px-6" style={{ background: 'var(--cor-fundo)' }}>
      <div className="w-full max-w-md">
        <h2 className="text-4xl font-[Georgia,serif] mb-2 text-center" style={{ color: 'var(--cor-texto)' }}>
          {modo === 'login'
            ? 'Entrar'
            : modo === 'registrar'
              ? 'Registrar'
              : modo === 'recuperar'
                ? 'Esqueci minha senha'
                : modo === 'redefinir'
                  ? 'Nova senha'
                  : 'Verificar e-mail'}
        </h2>
        <p className="text-center mb-8" style={{ color: 'var(--cor-texto-suave)' }}>
          {modo === 'login'
            ? 'Acesse sua conta Lume. Se ainda não tiver cadastro, clique em Crie Sua Conta.'
            : modo === 'registrar'
              ? 'Crie sua conta para começar a comprar.'
              : modo === 'recuperar'
                ? 'Informe o e-mail da sua conta e enviaremos um código para criar uma nova senha.'
                : modo === 'redefinir'
                  ? `Digite o código que enviamos para ${email} e escolha uma nova senha.`
                  : `Digite o código que enviamos para ${email}.`}
        </p>

        {sucesso && (
          <p
            className="mb-6 text-center text-sm py-2 px-4 rounded-lg"
            style={{
              background: 'var(--cor-fundo-cartao)',
              color: 'var(--cor-laranja-claro)',
              border: '1px solid var(--cor-borda)',
            }}
          >
            {sucesso}
          </p>
        )}

        {modo === 'verificar' ? (
          <FormVerificar
            codigo={codigo}
            setCodigo={setCodigo}
            erro={erro}
            carregando={carregando}
            cooldown={cooldown}
            envioPendente={envioPendente}
            onSubmit={handleVerificar}
            onReenviar={handleReenviar}
            onVoltarLogin={voltarAoLogin}
          />
        ) : modo === 'recuperar' ? (
          <FormRecuperar
            email={email}
            setEmail={setEmail}
            erro={erro}
            carregando={carregando}
            onSubmit={handleEsqueciSenha}
            onVoltarLogin={voltarAoLoginSemCodigo}
          />
        ) : modo === 'redefinir' ? (
          <FormRedefinir
            codigo={codigo}
            setCodigo={setCodigo}
            senha={senha}
            setSenha={setSenha}
            mostrarSenha={mostrarSenha}
            onAlternarSenha={alternarSenha}
            erro={erro}
            carregando={carregando}
            cooldown={cooldown}
            onSubmit={handleRedefinir}
            onReenviar={handleReenviarReset}
            onVoltarLogin={voltarAoLoginLimpandoSenha}
          />
        ) : modo === 'login' ? (
          <FormLogin
            email={email}
            setEmail={setEmail}
            senha={senha}
            setSenha={setSenha}
            mostrarSenha={mostrarSenha}
            onAlternarSenha={alternarSenha}
            erro={erro}
            carregando={carregando}
            onSubmit={handleLogin}
            onEsqueciSenha={irParaRecuperar}
          />
        ) : (
          <FormRegistrar
            nome={nome}
            setNome={setNome}
            email={email}
            setEmail={setEmail}
            senha={senha}
            setSenha={setSenha}
            mostrarSenha={mostrarSenha}
            onAlternarSenha={alternarSenha}
            erro={erro}
            carregando={carregando}
            onSubmit={handleRegistrar}
          />
        )}

        <LoginGoogle oculto={modoComCodigo} onEntrar={handleGoogleLogin} />

        {(modo === 'login' || modo === 'registrar') && (
          <p className="mt-6 text-center text-base" style={{ color: 'var(--cor-texto-suave)' }}>
            {modo === 'login' ? (
            <>
              Não tem uma conta?{' '}
              <button
                type="button"
                onClick={irParaRegistrar}
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
                onClick={irParaLogin}
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
