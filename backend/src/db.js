import pg from 'pg'
import env from './env.js'
import logger from './logger.js'

pg.types.setTypeParser(1700, (valor) => Number(valor))

const pool = new pg.Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  max: 10,
})

pool.on('error', (err) => {
  logger.error({ err }, 'Erro inesperado no pool do PostgreSQL')
})

export default pool
