const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const CHAVE_TOKEN = 'locus_token'
const CHAVE_USUARIO = 'locus_usuario'

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
    throw erro
  }
  return dados
}

export const api = {
  registrar: (dados) => requisicao('/auth/registrar', { metodo: 'POST', corpo: dados }),
  login: (dados) => requisicao('/auth/login', { metodo: 'POST', corpo: dados }),
  perfil: () => requisicao('/auth/perfil', { autenticado: true }),

  produtos: () => requisicao('/produtos'),

  favoritos: {
    listar: () => requisicao('/favoritos', { autenticado: true }),
    adicionar: (produtoId) => requisicao(`/favoritos/${produtoId}`, { metodo: 'POST', autenticado: true }),
    remover: (produtoId) => requisicao(`/favoritos/${produtoId}`, { metodo: 'DELETE', autenticado: true }),
  },

  criarPedido: (dados) => requisicao('/pedidos', { metodo: 'POST', corpo: dados }),
  criarPreferencia: (dados) => requisicao('/pagamentos/preferencia', { metodo: 'POST', corpo: dados }),
  criarAssinatura: (dados) => requisicao('/assinaturas', { metodo: 'POST', corpo: dados, autenticado: true }),
}