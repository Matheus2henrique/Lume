/**
 * Smoke test de subida — roda no CI (e localmente) contra um banco real.
 *
 * O que ele garante antes de qualquer deploy:
 *   1. o schema migra e o servidor sobe;
 *   2. /api/health enxerga o banco;
 *   3. o admin criado pelo seed CONSEGUE logar (o bug clássico é a rotina de
 *      limpeza apagar a conta não verificada em <= 60 s);
 *   4. o token emitido é aceito pelo middleware de autenticação;
 *   5. a conta do admin continua intacta depois da varredura de limpeza.
 *
 * Uso: node scripts/smoke.mjs  (usa as variáveis de ambiente do CI/.env)
 */
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as esperar } from 'node:timers/promises'
import jwt from 'jsonwebtoken'
import pool from '../src/db.js'

const RAIZ_BACKEND = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const PORTA = Number(process.env.SMOKE_PORT || 4100)
const BASE = `http://127.0.0.1:${PORTA}`
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@lume.com'
const ADMIN_SENHA = process.env.ADMIN_SENHA || ''

const falhas = []
const registrar = (ok, descricao) => {
  console.log(`${ok ? '  ✔' : '  ✘'} ${descricao}`)
  if (!ok) falhas.push(descricao)
}

async function requisitar(caminho, opcoes = {}) {
  const resposta = await fetch(`${BASE}${caminho}`, {
    ...opcoes,
    headers: { 'Content-Type': 'application/json', ...(opcoes.headers || {}) },
  })
  let corpo = null
  try {
    corpo = await resposta.json()
  } catch {
    corpo = null
  }
  return { status: resposta.status, corpo }
}

async function aguardarServidor(timeoutMs = 30_000) {
  const inicio = Date.now()
  while (Date.now() - inicio < timeoutMs) {
    try {
      const { status } = await requisitar('/api/health')
      if (status === 200) return true
    } catch {
      // servidor ainda subindo
    }
    await esperar(300)
  }
  return false
}

let servidor = null

async function main() {
  if (!ADMIN_SENHA) {
    console.error('  ✘ ADMIN_SENHA não definida — rode o seed:admin antes do smoke.')
    process.exit(1)
  }

  console.log(`\nSmoke: subindo o backend na porta ${PORTA}…`)
  servidor = spawn(process.execPath, ['src/server.js'], {
    cwd: RAIZ_BACKEND,
    env: { ...process.env, PORT: String(PORTA), NODE_ENV: process.env.NODE_ENV || 'development' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  servidor.stdout.on('data', (d) => process.stdout.write(`   [servidor] ${d}`))
  servidor.stderr.on('data', (d) => process.stderr.write(`   [servidor] ${d}`))

  const subiu = await aguardarServidor()
  registrar(subiu, 'servidor sobe e /api/health responde 200')
  if (!subiu) throw new Error('Servidor não subiu em 30 s.')

  // A limpeza de contas pendentes roda na subida: dá tempo dela executar
  // antes de conferir se o admin sobreviveu.
  await esperar(1_500)

  const { status: statusHealth, corpo: corpoHealth } = await requisitar('/api/health')
  registrar(statusHealth === 200 && corpoHealth?.banco === 'ok', '/api/health enxerga o banco')

  const pagina = await fetch(`http://localhost:${PORTA}/`).then(async (res) => ({
    status: res.status,
    texto: await res.text(),
  }))
  registrar(
    pagina.status === 200 && pagina.texto.includes('índice da API'),
    `GET / serve o índice da API (HTTP ${pagina.status})`
  )

  const { status: statusRotas, corpo: rotas } = await requisitar('/api/rotas')
  registrar(
    statusRotas === 200 && Array.isArray(rotas) && rotas.length >= 30,
    `/api/rotas lista ${Array.isArray(rotas) ? rotas.length : 0} rotas`
  )

  const login = await requisitar('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: ADMIN_EMAIL, senha: ADMIN_SENHA }),
  })
  const token = login.corpo?.token
  registrar(
    login.status === 200 && Boolean(token),
    `admin loga (HTTP ${login.status}${login.corpo?.erro ? ` — ${login.corpo.erro}` : ''})`
  )
  registrar(login.corpo?.usuario?.admin === true, 'sessão devolvida é de administrador')

  if (token) {
    const perfil = await requisitar('/api/auth/perfil', { headers: { Authorization: `Bearer ${token}` } })
    registrar(perfil.status === 200 && perfil.corpo?.usuario?.admin === true, 'token aceito no middleware de autenticação')

    // Sessão revogável: o token carrega a versão (tv) e o servidor compara
    // com a do banco. Um token de outra versão tem que morrer.
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString())
    registrar(typeof payload.tv === 'number', 'token emitido carrega tv (versão da sessão)')

    const tokenDeOutraVersao = jwt.sign(
      { id: payload.id, email: payload.email, tv: (payload.tv ?? 0) + 1 },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    )
    const revogado = await requisitar('/api/auth/perfil', {
      headers: { Authorization: `Bearer ${tokenDeOutraVersao}` },
    })
    registrar(revogado.status === 401, 'token de versão diferente é recusado (logout/troca de senha)')
  }

  // LGPD: newsletter só grava com consentimento explícito.
  const emailSmoke = `smoke+${Date.now()}@exemplo.com`
  const semAceite = await requisitar('/api/newsletter', {
    method: 'POST',
    body: JSON.stringify({ email: emailSmoke }),
  })
  registrar(semAceite.status === 400, 'newsletter recusa inscrição sem aceite')

  const comAceite = await requisitar('/api/newsletter', {
    method: 'POST',
    body: JSON.stringify({ email: emailSmoke, aceite: true }),
  })
  registrar(comAceite.status === 201, 'newsletter grava com aceite e data')

  const { rows } = await pool.query(
    'SELECT email_verificado FROM usuarios WHERE email = $1',
    [ADMIN_EMAIL]
  )
  registrar(rows.length === 1, 'admin ainda existe no banco (limpeza não apagou)')
  registrar(rows[0]?.email_verificado === true, 'admin está com email_verificado = TRUE')
}

try {
  await main()
} catch (err) {
  console.error(`\n  ✘ Erro inesperado no smoke: ${err.message}`)
  falhas.push(err.message)
} finally {
  if (servidor) servidor.kill('SIGTERM')
  await pool.end().catch(() => {})
  await esperar(300)
}

if (falhas.length > 0) {
  console.error(`\nSmoke FALHOU (${falhas.length} checagem(ns)):`)
  for (const f of falhas) console.error(`  - ${f}`)
  process.exit(1)
}

console.log('\nSmoke OK — todas as checagens passaram.')
process.exit(0)
