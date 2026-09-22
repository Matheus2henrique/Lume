import express from 'express'
import cors from 'cors'
import env from './env.js'
import logger from './logger.js'
import pool from './db.js'
import { limiterGlobal } from './middleware/rateLimiter.js'
import pedidosRouter from './routes/pedidos.js'
import authRouter from './routes/auth.js'
import produtosRouter from './routes/produtos.js'
import generosRouter from './routes/generos.js'
import favoritosRouter from './routes/favoritos.js'
import pagamentosRouter from './routes/pagamentos.js'
import newsletterRouter from './routes/newsletter.js'

const app = express()

// Confia no primeiro proxy (nginx, Railway, Render...) — necessário para o
// rate limit enxergar o IP real do cliente. Ative com TRUST_PROXY=true.
if (env.TRUST_PROXY) app.set('trust proxy', 1)
app.disable('x-powered-by')

app.use(limiterGlobal)

app.use(
  cors({
    origin: env.CLIENTE_ORIGEM.split(',').map((s) => s.trim()),
  })
)

// Cabeçalhos básicos de segurança.
app.use((_req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cross-Origin-Resource-Policy': 'cross-origin',
  })
  next()
})

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

app.use((_req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada.' })
})

app.use((err, _req, res, _next) => {
  logger.error({ err }, 'Erro não tratado')
  if (res.headersSent) return
  res.status(500).json({ erro: 'Erro interno do servidor.' })
})

if (process.env.NODE_ENV !== 'test') {
  const servidor = app.listen(env.PORT, () => {
    logger.info(`Lume backend rodando em http://localhost:${env.PORT}`)
  })

  // Encerramento gracioso: fecha o servidor e devolve as conexões do pool.
  const encerrar = (sinal) => {
    logger.info({ sinal }, 'Encerrando o Lume backend…')
    servidor.close(() => {
      pool.end().finally(() => process.exit(0))
    })
    setTimeout(() => process.exit(1), 10_000).unref()
  }
  process.on('SIGINT', () => encerrar('SIGINT'))
  process.on('SIGTERM', () => encerrar('SIGTERM'))
}

export default app
