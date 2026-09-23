import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const diretorio = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const entrada = pathToFileURL(path.join(diretorio, 'src', 'env.js')).href

/**
 * Carrega src/env.js em um processo separado (o env.js lê as variáveis no
 * boot e chama process.exit(1) quando a configuração de produção é inválida).
 */
function carregarEnv(extra = {}) {
  const script =
    `import(${JSON.stringify(entrada)})` +
    `.then(() => process.exit(0))` +
    `.catch((e) => { console.error(e); process.exit(1) })`

  return spawnSync(process.execPath, ['-e', script], {
    cwd: diretorio,
    encoding: 'utf8',
    env: {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      NODE_ENV: 'production',
      JWT_SECRET: 'x'.repeat(48),
      CLIENTE_ORIGEM: 'https://matheus2henrique.github.io',
      DB_PASSWORD: 'senha-forte-de-teste',
      ...extra,
    },
  })
}

function saida(resultado) {
  return `${resultado.stdout || ''}${resultado.stderr || ''}`
}

describe('Travas de configuração de produção (src/env.js)', () => {
  it('sobe com configuração de produção válida', () => {
    const resultado = carregarEnv()
    expect(resultado.status).toBe(0)
  })

  it('RECUSA iniciar com JWT_SECRET curto', () => {
    const resultado = carregarEnv({ JWT_SECRET: 'abc123' })
    expect(resultado.status).toBe(1)
    expect(saida(resultado)).toContain('JWT_SECRET')
  })

  it('RECUSA iniciar com JWT_SECRET ainda sendo o placeholder', () => {
    const resultado = carregarEnv({ JWT_SECRET: 'troque-este-segredo-por-um-valor-longo-e-aleatorio' })
    expect(resultado.status).toBe(1)
    expect(saida(resultado)).toContain('JWT_SECRET')
  })

  it('RECUSA iniciar com CORS apontando para localhost', () => {
    const resultado = carregarEnv({ CLIENTE_ORIGEM: 'http://localhost:5173' })
    expect(resultado.status).toBe(1)
    expect(saida(resultado)).toContain('CLIENTE_ORIGEM')
  })

  it('RECUSA iniciar com senha de banco padrão', () => {
    const resultado = carregarEnv({ DB_PASSWORD: 'postgres' })
    expect(resultado.status).toBe(1)
    expect(saida(resultado)).toContain('DB_PASSWORD')
  })

  it('avisa (mas não bloqueia) quando SMTP e Mercado Pago estão vazios', () => {
    const resultado = carregarEnv({ EMAIL_SMTP_USER: '', EMAIL_SMTP_PASS: '', MP_ACCESS_TOKEN: '' })
    expect(resultado.status).toBe(0)
    expect(saida(resultado)).toContain('SIMULADOS')
    expect(saida(resultado)).toContain('MP_ACCESS_TOKEN')
  })

  it('em development não aplica as travas (config de máquina local)', () => {
    const resultado = carregarEnv({
      NODE_ENV: 'development',
      JWT_SECRET: 'segredo-local-curto',
      CLIENTE_ORIGEM: 'http://localhost:5173',
      DB_PASSWORD: 'postgres',
    })
    expect(resultado.status).toBe(0)
  })
})
