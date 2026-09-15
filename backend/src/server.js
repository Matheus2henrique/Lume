import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import pedidosRouter from './routes/pedidos.js'
import authRouter from './routes/auth.js'
import produtosRouter from './routes/produtos.js'
import favoritosRouter from './routes/favoritos.js'
import assinaturasRouter from './routes/assinaturas.js'
import pagamentosRouter from './routes/pagamentos.js'

dotenv.config()

const app = express()
const porta = process.env.PORT || 4000

app.use(
  cors({
    origin: process.env.CLIENTE_ORIGEM?.split(',') || 'http://localhost:5173',
  })
)
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, servico: 'locus-backend' })
})

app.use('/api/pedidos', pedidosRouter)
app.use('/api/auth', authRouter)
app.use('/api/produtos', produtosRouter)
app.use('/api/favoritos', favoritosRouter)
app.use('/api/assinaturas', assinaturasRouter)
app.use('/api/pagamentos', pagamentosRouter)

app.use((_req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada.' })
})

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ erro: 'Erro interno do servidor.' })
})

app.listen(porta, () => {
  console.log(`Locus backend rodando em http://localhost:${porta}`)
})