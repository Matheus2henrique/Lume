import pg from 'pg'
import env from './env.js'
import logger from './logger.js'
import { montarConfigPool } from './dbConfig.js'

// numeric (1700) vira Number: totais/preços chegam prontos sem BigDecimal.
pg.types.setTypeParser(1700, (valor) => Number(valor))

const pool = new pg.Pool(montarConfigPool(env))

pool.on('error', (err) => {
  logger.error({ err }, 'Erro inesperado no pool do PostgreSQL')
})

export default pool
