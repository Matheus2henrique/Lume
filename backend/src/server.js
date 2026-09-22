import express from 'express'
import cors from 'cors'
import env from './env.js'
import logger from './logger.js'
import { limiterGlobal } from './middleware/rateLimiter.js'
import pedidosRouter from './routes/pedidos.js'
import authRouter from './routes/auth.js'
import produtosRouter from './routes/produtos.js'
import generosRouter from './routes/generos.js'
import favoritosRouter from './routes/favoritos.js'
import pagamentosRouter from './routes/pagamentos.js'
import newsletterRouter from './routes/newsletter.js'

const app = express()

app.use(limiterGlobal)

app.use(
  cors({
    origin: env.CLIENTE_ORIGEM.split(',').map((s) => s.trim()),
  })
)
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, servico: 'lume-backend' })
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
  res.status(500).json({ erro: 'Erro interno do servidor.' })
})

if (process.env.NODE_ENV !== 'test') {
  app.listen(env.PORT, () => {
    logger.info(`Lume backend rodando em http://localhost:${env.PORT}`)
  })
}

export default app
