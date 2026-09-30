/**
 * Backup do PostgreSQL com pg_dump (formato custom, comprimido).
 *
 * Uso:
 *   npm run backup                # detecta pg_dump no PATH ou usa Docker
 *   npm run backup -- --docker    # força os binários do container
 *   npm run backup -- --direto    # força o pg_dump do PATH
 *
 * Saída: backend/backups/lume-<data-hora>.dump
 * Retenção: mantém os BACKUP_MANUTENCAO (padrão 14) mais recentes.
 *
 * Agendamento — sem restore testado, backup não existe:
 *   Windows: Agendador de Tarefas → ação "Programa" → powershell
 *            -File "%CD%\backend\scripts\backup.mjs" (ou npm run backup)
 *   Linux:   0 3 * * * cd /caminho/do/projeto && npm run backup >> backup.log 2>&1
 */
import fs from 'node:fs'
import path from 'node:path'
import { DIR_BACKUPS, comandoPgDump, detectarModo, executar } from './_pg.mjs'

const RETENCAO =
  Number(process.env.BACKUP_MANUTENCAO) > 0 ? Number(process.env.BACKUP_MANUTENCAO) : 14

const modo = detectarModo()
console.log(`\nBackup do banco via "${modo}"…`)

const inicio = Date.now()
const { comando, args, ambiente } = comandoPgDump(modo)
const dump = executar({ comando, args, ambiente })

// Um dump de verdade nunca vem vazio — se vier, o comando errou em silêncio.
if (dump.length < 512) {
  throw new Error(`Dump suspeito (${dump.length} bytes) — verifique usuário/banco informados.`)
}

fs.mkdirSync(DIR_BACKUPS, { recursive: true })
const carimbo = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const destino = path.join(DIR_BACKUPS, `lume-${carimbo}.dump`)
fs.writeFileSync(destino, dump)

const segundos = ((Date.now() - inicio) / 1000).toFixed(1)
console.log(
  `  ✔ ${path.basename(destino)} — ${(dump.length / 1024 / 1024).toFixed(2)} MB em ${segundos}s`
)

const arquivos = fs
  .readdirSync(DIR_BACKUPS)
  .filter((nome) => nome.endsWith('.dump'))
  .map((nome) => path.join(DIR_BACKUPS, nome))
  .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)

const excedentes = arquivos.slice(RETENCAO)
for (const arquivo of excedentes) fs.rmSync(arquivo, { force: true })

console.log(
  `  ✔ Retenção: ${arquivos.length} arquivo(s), ${excedentes.length} removido(s) (mantém ${RETENCAO}).`
)
console.log(`  Próximo passo obrigatório: npm run restore:teste\n`)
