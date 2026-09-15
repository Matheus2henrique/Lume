import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

pg.types.setTypeParser(1700, (valor) => Number(valor))

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'locus',
  max: 10,
})

pool.on('error', (err) => {
  console.error('Erro inesperado no pool do PostgreSQL:', err.message)
})

export default pool
