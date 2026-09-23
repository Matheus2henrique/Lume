const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const CHAVE_TOKEN = 'lume_token'
const CHAVE_USUARIO = 'lume_usuario'

export function salvarSessao({ token, usuario }) {
  localStorage.setItem(CHAVE_TOKEN, token)
  localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario))
}

export function limparSessao() {
  localStorage.removeItem(CHAVE_TOKEN)
  localStorage.removeItem(CHAVE_USUARIO)
}

export function obterToken() {
  return localStorage.getItem(CHAVE_TOKEN)
}

export function obterUsuario() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_USUARIO))
  } catch {
    return null
  }
}

/**
 * Existe sessão VÁLIDA? Além de ter token, confere a data de expiração (exp)
 * do JWT — token antigo/expirado não deve liberar a compra.
 */
export function sessaoValida() {
  const token = obterToken()
  if (!token) return false
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now()
  } catch {
    return false
  }
}

async function requisicao(caminho, { metodo = 'GET', corpo, autenticado = false } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (autenticado) {
    const token = obterToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let resposta
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      method: metodo,
      headers,
      body: corpo ? JSON.stringify(corpo) : undefined,
    })
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando.')
  }

  let dados = null
  try {
    dados = await resposta.json()
  } catch {
    // respostas sem corpo JSON
  }

  if (!resposta.ok) {
    const mensagem = dados?.erro || dados?.mensagem || 'Algo deu errado.'
    const erro = new Error(mensagem)
    erro.status = resposta.status
    erro.dados = dados
    throw erro
  }
  return dados
}

export const api = {
  registrar: (dados) => requisicao('/auth/registrar', { metodo: 'POST', corpo: dados }),
  login: (dados) => requisicao('/auth/login', { metodo: 'POST', corpo: dados }),
  verificarCodigo: (dados) => requisicao('/auth/verificar', { metodo: 'POST', corpo: dados }),
  reenviarVerificacao: (dados) => requisicao('/auth/reenviar-verificacao', { metodo: 'POST', corpo: dados }),
  perfil: () => requisicao('/auth/perfil', { autenticado: true }),

  produtos: {
    listar: () => requisicao('/produtos'),
    buscar: (id) => requisicao(`/produtos/${id}`),
    criar: (dados) => requisicao('/produtos', { metodo: 'POST', corpo: dados, autenticado: true }),
    atualizar: (id, dados) => requisicao(`/produtos/${id}`, { metodo: 'PUT', corpo: dados, autenticado: true }),
    excluir: (id) => requisicao(`/produtos/${id}`, { metodo: 'DELETE', autenticado: true }),
  },

  generos: {
    listar: () => requisicao('/generos'),
    criar: (dados) => requisicao('/generos', { metodo: 'POST', corpo: dados, autenticado: true }),
    atualizar: (id, dados) => requisicao(`/generos/${id}`, { metodo: 'PUT', corpo: dados, autenticado: true }),
    excluir: (id) => requisicao(`/generos/${id}`, { metodo: 'DELETE', autenticado: true }),
  },

  favoritos: {
    listar: () => requisicao('/favoritos', { autenticado: true }),
    adicionar: (produtoId) => requisicao(`/favoritos/${produtoId}`, { metodo: 'POST', autenticado: true }),
    remover: (produtoId) => requisicao(`/favoritos/${produtoId}`, { metodo: 'DELETE', autenticado: true }),
  },

  criarPedido: (dados) => requisicao('/pedidos', { metodo: 'POST', corpo: dados, autenticado: true }),
  criarPreferencia: (dados) => requisicao('/pagamentos/preferencia', { metodo: 'POST', corpo: dados, autenticado: true }),
  statusPagamento: () => requisicao('/pagamentos/status'),
  newsletter: (email) => requisicao('/newsletter', { metodo: 'POST', corpo: { email } }),
}