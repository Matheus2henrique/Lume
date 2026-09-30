/**
 * Auxilio compartilhado pelos scripts de backup/restore.
 *
 * Modos de execucao:
 *  • 'direto' — usa pg_dump/pg_restore do PATH ou de PG_DUMP_BIN/PG_RESTORE_BIN;
 *  • 'docker' — usa os binarios dentro do container do Postgres do compose.
 *
 * O modo e detectado automaticamente (pg_dump acessivel -> direto; caso
 * contrario -> docker) e pode ser forcado com --direto / --docker.
 * Tambem aceita --pg-bin <pasta> apontando para a pasta dos binarios.
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

export const RAIZ_BACKEND = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const RAIZ_REPO = path.resolve(RAIZ_BACKEND, '..')
export const DIR_BACKUPS = path.join(RAIZ_BACKEND, 'backups')

// Os scripts de operacao leem o .env diretamente: importar src/env.js dispararia
// as travas de producao (process.exit) e derrubaria um backup agendado.
dotenv.config({ path: path.join(RAIZ_BACKEND, '.env') })

const cfg = (chave, padrao = '') => process.env[chave] ?? padrao

export const db = {
  host: cfg('DB_HOST', 'localhost'),
  port: cfg('DB_PORT', '5432'),
  user: cfg('DB_USER', 'postgres'),
  password: cfg('DB_PASSWORD', 'postgres'),
  name: cfg('DB_NAME', 'lume'),
}

const COMPOSE_FILE = path.join(RAIZ_REPO, 'docker-compose.yml')
const SERVICO_DB = 'db'
const VARIAVEL_BINARIO = { pg_dump: 'PG_DUMP_BIN', pg_restore: 'PG_RESTORE_BIN' }

/**
 * Resolve o executavel do Postgres, nesta ordem:
 *   1. PG_DUMP_BIN / PG_RESTORE_BIN no ambiente;
 *   2. --pg-bin <pasta> na linha de comando (pasta com os binarios);
 *   3. nome simples, buscado no PATH.
 */
export function caminhoBinario(nome) {
  const sobrescrito = process.env[VARIAVEL_BINARIO[nome]]
  if (sobrescrito) return sobrescrito

  const argv = process.argv.slice(2)
  const indice = argv.indexOf('--pg-bin')
  if (indice >= 0 && argv[indice + 1]) {
    const sufixo = process.platform === 'win32' ? '.exe' : ''
    return path.join(argv[indice + 1], `${nome}${sufixo}`)
  }
  return nome
}

function disponivel(binario) {
  const resultado = spawnSync(binario, ['--version'], { encoding: 'utf8' })
  return !resultado.error && resultado.status === 0
}

export function detectarModo(argv = process.argv.slice(2)) {
  if (argv.includes('--docker')) return 'docker'
  if (argv.includes('--direto')) return 'direto'
  if (disponivel(caminhoBinario('pg_dump'))) return 'direto'
  if (disponivel('docker')) return 'docker'
  throw new Error(
    'Nenhum pg_dump encontrado. Instale o PostgreSQL (e coloque no PATH), ' +
      'defina PG_DUMP_BIN, use --pg-bin <pasta> ou --docker.'
  )
}

function argsCompose() {
  return ['compose', '-f', COMPOSE_FILE]
}

function ambienteDireto() {
  return { ...process.env, PGPASSWORD: db.password }
}

/**
 * pg_dump em formato custom (comprimido e restauravel com pg_restore).
 * Sempre escreve na stdout — o chamador grava o arquivo.
 */
export function comandoPgDump(modo) {
  const especificos =
    modo === 'docker'
      ? ['pg_dump', '-U', db.user, '-d', db.name, '-Fc', '--no-owner']
      : ['-h', db.host, '-p', String(db.port), '-U', db.user, '-d', db.name, '-Fc', '--no-owner']

  return modo === 'docker'
    ? { comando: 'docker', args: [...argsCompose(), 'exec', '-T', SERVICO_DB, ...especificos], ambiente: process.env }
    : { comando: caminhoBinario('pg_dump'), args: especificos, ambiente: ambienteDireto() }
}

/** pg_restore lendo o dump da entrada padrao (stdin). */
export function comandoPgRestore(modo, bancoAlvo) {
  const especificos =
    modo === 'docker'
      ? ['pg_restore', '-U', db.user, '-d', bancoAlvo, '--no-owner', '--clean', '--if-exists']
      : [
          '-h', db.host, '-p', String(db.port), '-U', db.user,
          '-d', bancoAlvo, '--no-owner', '--clean', '--if-exists',
        ]

  return modo === 'docker'
    ? { comando: 'docker', args: [...argsCompose(), 'exec', '-T', SERVICO_DB, ...especificos], ambiente: process.env }
    : { comando: caminhoBinario('pg_restore'), args: especificos, ambiente: ambienteDireto() }
}

/** Executa de forma sincrona, devolvendo stdout como Buffer. */
export function executar({ comando, args, ambiente = process.env, entrada }) {
  const resultado = spawnSync(comando, args, {
    cwd: RAIZ_REPO,
    env: ambiente,
    input: entrada,
    maxBuffer: 1024 * 1024 * 512,
  })

  if (resultado.error) {
    throw new Error(`Falha ao executar "${comando}": ${resultado.error.message}`)
  }
  if (resultado.status !== 0) {
    const stderr = (resultado.stderr || Buffer.alloc(0)).toString('utf8').trim()
    throw new Error(`"${comando}" terminou com codigo ${resultado.status}${stderr ? `:\n${stderr}` : ''}`)
  }
  return resultado.stdout || Buffer.alloc(0)
}

/** Dump mais recente em backend/backups (ou o caminho passado como argumento). */
export function dumpMaisRecente(argv = []) {
  const explicito = argv.find((a) => a.endsWith('.dump'))
  if (explicito) return path.resolve(explicito)
  if (!fs.existsSync(DIR_BACKUPS)) return null

  const dumps = fs
    .readdirSync(DIR_BACKUPS)
    .filter((nome) => nome.endsWith('.dump'))
    .map((nome) => path.join(DIR_BACKUPS, nome))
    .sort((a, b) => fs.statSync(a).mtimeMs - fs.statSync(b).mtimeMs)

  return dumps.length > 0 ? dumps[dumps.length - 1] : null
}
