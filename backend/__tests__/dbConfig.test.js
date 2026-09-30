import { montarConfigPool } from '../src/dbConfig.js'

const ENV_BASE = {
  DB_HOST: 'localhost',
  DB_PORT: 5432,
  DB_USER: 'postgres',
  DB_PASSWORD: 'senha',
  DB_NAME: 'lume',
  DB_SSL: false,
  DB_SSL_REJECT_UNAUTHORIZED: true,
  DB_POOL_MAX: 10,
  DB_CONN_TIMEOUT_MS: 10_000,
  DB_IDLE_TIMEOUT_MS: 30_000,
  DB_STATEMENT_TIMEOUT_MS: 30_000,
}

describe('montarConfigPool', () => {
  it('monta a configuração base sem TLS (banco local)', () => {
    const config = montarConfigPool(ENV_BASE)
    expect(config).toMatchObject({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      database: 'lume',
      max: 10,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 30_000,
      statement_timeout: 30_000,
    })
    expect(config.ssl).toBeUndefined()
  })

  it('liga o TLS quando DB_SSL=true (banco gerenciado)', () => {
    const config = montarConfigPool({ ...ENV_BASE, DB_SSL: true })
    expect(config.ssl).toEqual({ rejectUnauthorized: true })
  })

  it('permite relaxar a validação do certificado explicitamente', () => {
    const config = montarConfigPool({
      ...ENV_BASE,
      DB_SSL: true,
      DB_SSL_REJECT_UNAUTHORIZED: false,
    })
    expect(config.ssl).toEqual({ rejectUnauthorized: false })
  })

  it('honra os limites de pool e timeout vindos do env', () => {
    const config = montarConfigPool({
      ...ENV_BASE,
      DB_POOL_MAX: 25,
      DB_CONN_TIMEOUT_MS: 2_500,
      DB_IDLE_TIMEOUT_MS: 5_000,
      DB_STATEMENT_TIMEOUT_MS: 45_000,
    })
    expect(config.max).toBe(25)
    expect(config.connectionTimeoutMillis).toBe(2_500)
    expect(config.idleTimeoutMillis).toBe(5_000)
    expect(config.statement_timeout).toBe(45_000)
  })

  it('não envia senha vazia para o driver', () => {
    const config = montarConfigPool({ ...ENV_BASE, DB_PASSWORD: '' })
    expect(config.password).toBe('')
    expect(config.user).toBe('postgres')
  })
})
