import rateLimit from 'express-rate-limit'

// Rotas que não podem ser limitadas pelo teto global de 100 req/min/IP:
//  • /api/pagamentos/webhook — o Mercado Pago reenvia do mesmo IP e um 429
//    aqui faria o pagamento nunca confirmar;
//  • /api/health — sondagem do orquestrador/CDN, barata e crítica.
export const ROTAS_FORA_DO_LIMITE_GLOBAL = [
  '/api/pagamentos/webhook',
  '/api/health',
]

export function foraDoLimiteGlobal(req) {
  return ROTAS_FORA_DO_LIMITE_GLOBAL.includes(req.path)
}

// Marca o middleware com o nome do limite. O índice de rotas (GET /) lê essa
// propriedade para mostrar em qual rota há rate limit — sem isso, o
// express-rate-limit devolve uma função anônima e some da descoberta.
function comLimite(middleware, rotulo) {
  Object.defineProperty(middleware, 'limite', { value: rotulo })
  return middleware
}

export const limiterGlobal = comLimite(
  rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    skip: foraDoLimiteGlobal,
    message: { erro: 'Muitas requisições. Tente novamente em 1 minuto.' },
  }),
  'limiterGlobal'
)

// Webhook com teto próprio: bloqueia flood sem colocar o pagamento em risco.
export const limiterWebhook = comLimite(
  rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { erro: 'Muitas notificações. Tente novamente em 1 minuto.' },
  }),
  'limiterWebhook'
)

export const limiterAuth = comLimite(
  rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { erro: 'Muitas tentativas. Aguarde 1 minuto.' },
  }),
  'limiterAuth'
)

// Conta: o teto de cima é por IP — um atacante trocando de IP/VPN passa por
// ele. Este limite é por e-mail, então a força bruta trava na conta alvo.
// Memória local (decisão da rodada: sem Redis); vale por processo.
export const limiterLogin = comLimite(
  rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    // Login certinho não consome a cota do IP: só erro conta.
    skipSuccessfulRequests: true,
    message: { erro: 'Muitas tentativas. Aguarde 1 minuto.' },
  }),
  'limiterLogin'
)

const JANELA_FALHAS_MS = 15 * 60 * 1000
const MAX_FALHAS_CONTA = 5
const MAX_CONTAS_RASTREADAS = 10_000
const falhasPorConta = new Map()

function chaveDeConta(email) {
  return String(email || '').toLowerCase().trim()
}

function descartarExpiradas(agora) {
  for (const [chave, registro] of falhasPorConta) {
    if (registro.tentativas.filter((ts) => agora - ts < JANELA_FALHAS_MS).length === 0) {
      falhasPorConta.delete(chave)
    }
  }
}

export function contaBloqueada(email) {
  const chave = chaveDeConta(email)
  if (!chave) return false
  const registro = falhasPorConta.get(chave)
  if (!registro) return false
  const agora = Date.now()
  const recentes = registro.tentativas.filter((ts) => agora - ts < JANELA_FALHAS_MS)
  if (recentes.length >= MAX_FALHAS_CONTA) return true
  if (recentes.length === 0) falhasPorConta.delete(chave)
  return false
}

export function registrarFalhaDeConta(email) {
  const chave = chaveDeConta(email)
  if (!chave) return
  const agora = Date.now()
  if (falhasPorConta.size >= MAX_CONTAS_RASTREADAS) descartarExpiradas(agora)
  const registro = falhasPorConta.get(chave) || { tentativas: [] }
  registro.tentativas.push(agora)
  falhasPorConta.set(chave, registro)
}

export function limparFalhasDeConta(email) {
  falhasPorConta.delete(chaveDeConta(email))
}

// Aplica ANTES do handler: devolve 429 sem consultar o banco.
export function limiterConta(req, res, next) {
  if (contaBloqueada(req.body?.email)) {
    return res.status(429).json({ erro: 'Muitas tentativas para esta conta. Aguarde alguns minutos.' })
  }
  next()
}
Object.defineProperty(limiterConta, 'limite', { value: 'limiterConta' })

// Só para teste: cada teste começa com as contas desbloqueadas.
export function resetarFalhasDeConta() {
  falhasPorConta.clear()
}

export const limiterPagamento = comLimite(
  rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { erro: 'Muitas requisições de pagamento. Tente novamente em 1 minuto.' },
  }),
  'limiterPagamento'
)

export const limiterReenvio = comLimite(
  rateLimit({
    windowMs: 60 * 1000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: { erro: 'Muitos reenvios. Tente novamente em 1 minuto.' },
  }),
  'limiterReenvio'
)

// Cotação de frete: cada chamada gasta cota na API do Melhor Envio.
export const limiterFrete = comLimite(
  rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { erro: 'Muitas cotações de frete. Tente novamente em 1 minuto.' },
  }),
  'limiterFrete'
)

// Avaliação de produto: escrita rara de verdade (1 por produto por conta),
// então 10/min por IP deixa o spam de comentários caro sem incomodar ninguém.
export const limiterAvaliacao = comLimite(
  rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { erro: 'Muitas avaliações em pouco tempo. Tente novamente em 1 minuto.' },
  }),
  'limiterAvaliacao'
)
