import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { pinoHttp } from 'pino-http'
import env from './env.js'
import logger from './logger.js'
import pool from './db.js'
import { limiterGlobal } from './middleware/rateLimiter.js'
import { listarRotas, htmlDasRotas } from './rotas.js'
import pedidosRouter from './routes/pedidos.js'
import authRouter from './routes/auth.js'
import produtosRouter from './routes/produtos.js'
import generosRouter from './routes/generos.js'
import favoritosRouter from './routes/favoritos.js'
import pagamentosRouter from './routes/pagamentos.js'
import newsletterRouter from './routes/newsletter.js'
import { limparContasPendentesExpiradas, expirarPedidosNaoPagos } from './services/limpeza.js'

const app = express()

// Confia no primeiro proxy (nginx, Railway, Render...) — necessário para o
// rate limit enxergar o IP real do cliente. Ative com TRUST_PROXY=true.
if (env.TRUST_PROXY) app.set('trust proxy', 1)
app.disable('x-powered-by')

// Uma linha por requisição (rota, status, ms) com reqId compartilhado pelo
// resto do log. Serializadores explícitos: nunca imprime Authorization/Cookie.
if (process.env.NODE_ENV !== 'test') {
  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req) =>
          req.url === '/api/health' || req.url?.startsWith('/api/pagamentos/webhook'),
      },
      serializers: {
        req(req) {
          return { metodo: req.method, url: req.url, ip: req.remoteAddress }
        },
        res(res) {
          return { status: res.statusCode }
        },
      },
    })
  )
}

app.use(limiterGlobal)

app.use(
  cors({
    origin: env.CLIENTE_ORIGEM.split(',').map((s) => s.trim()),
  })
)

// Cabeçalhos de segurança completos: HSTS, CSP de API (nenhum recurso próprio),
// X-Frame-Options DENY, nosniff, Referrer-Policy e CORP.
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'none'"],
        baseUri: ["'none'"],
        formAction: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
)

// Limite maior que o padrão (100kb) para aceitar imagens de produto em
// base64 no cadastro do admin. Substituir por upload dedicado — ver
// PLANO_PRODUCAO.md.
app.use(express.json({ limit: '10mb' }))

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ ok: true, servico: 'lume-backend', banco: 'ok' })
  } catch {
    res.status(503).json({ ok: false, servico: 'lume-backend', banco: 'erro' })
  }
})

app.use('/api/pedidos', pedidosRouter)
app.use('/api/auth', authRouter)
app.use('/api/produtos', produtosRouter)
app.use('/api/generos', generosRouter)
app.use('/api/favoritos', favoritosRouter)
app.use('/api/pagamentos', pagamentosRouter)
app.use('/api/newsletter', newsletterRouter)

// Índice das rotas, descoberto do próprio Express (fonte única: src/rotas.js).
app.get('/api/rotas', (_req, res) => {
  res.json(listarRotas(app))
})

// Página do índice em / : grupos por método (colapsáveis), acesso, rate limit
// e link/botão para bater direto na rota.
app.get('/', (_req, res) => {
  // A CSP do helmet é "default-src 'none'" (API pura). Esta página usa CSS/JS
  // inline e fetch na mesma origem, então trocamos por uma política restrita:
  // sem origens externas, sem inline de terceiros, sem frame.
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
  )
  res.type('html').send(htmlDasRotas(listarRotas(app)))
})

app.use((_req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada.' })
})

// Erros de validação de corpo (body-parser) já chegam com status 400/413;
// erro de cast/constraint do Postgres vira 400 em vez de 500 enganoso.
const STATUS_POR_TIPO = {
  'entity.parse.failed': 400,
  'entity.verify.failed': 400,
  'entity.too.large': 413,
  'charset.unsupported': 415,
  'request.aborted': 400,
}
const CODIGOS_PG_DE_DADOS_INVALIDOS = new Set([
  '22P02', // inválido para text representation (cast)
  '22003', // valor fora do intervalo
  '22001', // string longa demais
  '22007', // formato de data/hora inválido
  '23514', // violação de CHECK
])

export function statusDoErro(err) {
  const explicito = err?.status ?? err?.statusCode
  if (Number.isInteger(explicito) && explicito >= 400 && explicito < 600) return explicito
  if (err?.type && STATUS_POR_TIPO[err.type]) return STATUS_POR_TIPO[err.type]
  if (CODIGOS_PG_DE_DADOS_INVALIDOS.has(err?.code)) return 400
  if (err?.code === '23505') return 409
  return 500
}

function mensagemDoErro(err, status) {
  if (status === 400 && err?.type === 'entity.parse.failed') return 'JSON inválido na requisição.'
  if (status === 413) return 'Corpo da requisição maior que o limite permitido.'
  if (status === 415) return 'Codificação do corpo da requisição não suportada.'
  if (status === 409) return 'Já existe um registro com esses dados.'
  if (status === 400 && CODIGOS_PG_DE_DADOS_INVALIDOS.has(err?.code)) {
    return 'Dados inválidos na requisição.'
  }
  if (status >= 500) return 'Erro interno do servidor.'
  return 'Requisição inválida.'
}

app.use((err, req, res, _next) => {
  const status = statusDoErro(err)
  const contexto = {
    reqId: req?.id ?? null,
    rota: req?.originalUrl ?? null,
    status,
    detalhe: { message: err?.message, type: err?.type, code: err?.code },
  }

  // 4xx é esperado (cliente errou) e não deve poluir o log como incidente.
  if (status >= 500) logger.error({ ...contexto, err }, 'Erro não tratado')
  else logger.warn(contexto, 'Requisição rejeitada')

  if (res.headersSent) return
  res.status(status).json({ erro: mensagemDoErro(err, status) })
})

if (process.env.NODE_ENV !== 'test') {
  const servidor = app.listen(env.PORT, () => {
    logger.info(`Lume backend rodando em http://localhost:${env.PORT}`)
  })

  // Rotina de limpeza: contas pendentes que estouraram os 10 min saem do
  // banco; pedidos 'pendente' além do prazo de pagamento são cancelados e
  // devolvem a peça reservada (PLANO 1.6).
  // Roda na subida e depois a cada minuto (unref não segura o processo).
  const rotinaDeLimpeza = () => {
    limparContasPendentesExpiradas()
    expirarPedidosNaoPagos()
  }
  rotinaDeLimpeza()
  const timerLimpeza = setInterval(rotinaDeLimpeza, 60_000)
  timerLimpeza.unref()

  // Encerramento gracioso: fecha o servidor e devolve as conexões do pool.
  const encerrar = (sinal) => {
    logger.info({ sinal }, 'Encerrando o Lume backend…')
    clearInterval(timerLimpeza)
    servidor.close(() => {
      pool.end().finally(() => process.exit(0))
    })
    setTimeout(() => process.exit(1), 10_000).unref()
  }
  process.on('SIGINT', () => encerrar('SIGINT'))
  process.on('SIGTERM', () => encerrar('SIGTERM'))
}

export default app
