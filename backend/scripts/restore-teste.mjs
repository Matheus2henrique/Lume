/**
 * Teste de restore — o que transforma "temos backup" em "temos restore".
 *
 * O que faz:
 *   1. cria um banco descartável (lume_restore_teste);
 *   2. restaura o dump mais recente nele com pg_restore;
 *   3. compara tabelas, contagens e constraints com o banco de origem;
 *   4. apaga o banco de teste e informa PASSOU/FALHOU.
 *
 * Uso:
 *   npm run restore:teste                          # usa o dump mais recente
 *   npm run restore:teste -- caminho/dump.dump     # dump específico
 *   npm run restore:teste -- --docker              # binários do container
 *
 * Rode ao menos uma vez por mês (e antes do primeiro dia de operação).
 */
import fs from 'node:fs'
import path from 'node:path'
import { Client } from 'pg'
import {
  DIR_BACKUPS,
  comandoPgRestore,
  db,
  detectarModo,
  dumpMaisRecente,
  executar,
} from './_pg.mjs'

const BANCO_TESTE = process.env.RESTORE_BANCO_TESTE || 'lume_restore_teste'
const TABELAS = ['usuarios', 'clientes', 'generos', 'produtos', 'pedidos', 'favoritos', 'newsletter']

if (!/^[a-z_][a-z0-9_]*$/i.test(BANCO_TESTE)) {
  console.error(`Nome de banco de teste inválido: ${BANCO_TESTE}`)
  process.exit(1)
}

const argv = process.argv.slice(2)
const dump = dumpMaisRecente(argv)

if (!dump) {
  console.error(`\nNenhum dump encontrado em ${DIR_BACKUPS}.`)
  console.error('Rode "npm run backup" antes do teste de restore.\n')
  process.exit(1)
}
if (!fs.existsSync(dump)) {
  console.error(`\nArquivo não encontrado: ${dump}\n`)
  process.exit(1)
}

function conectar(database) {
  return new Client({
    host: db.host,
    port: Number(db.port),
    user: db.user,
    password: db.password,
    database,
  })
}

async function rodarSql(database, sql) {
  const cliente = conectar(database)
  await cliente.connect()
  try {
    return await cliente.query(sql)
  } finally {
    await cliente.end()
  }
}

/** Tabelas presentes, contagem de linhas e quantidade de CHECKs. */
async function inspecionar(database) {
  const cliente = conectar(database)
  await cliente.connect()
  try {
    const { rows: tabelas } = await cliente.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = ANY($1)`,
      [TABELAS]
    )
    const existentes = tabelas.map((linha) => linha.table_name).sort()

    const contagens = {}
    for (const nome of existentes) {
      if (!TABELAS.includes(nome)) continue
      const { rows } = await cliente.query(`SELECT count(*)::int AS total FROM ${nome}`)
      contagens[nome] = rows[0].total
    }

    const { rows: checks } = await cliente.query(
      `SELECT count(*)::int AS total FROM information_schema.check_constraints
       WHERE constraint_schema = 'public'`
    )

    return { existentes, contagens, checks: checks[0].total }
  } finally {
    await cliente.end()
  }
}

const falhas = []
const registrar = (ok, descricao) => {
  console.log(`${ok ? '  ✔' : '  ✘'} ${descricao}`)
  if (!ok) falhas.push(descricao)
}

console.log(`\nTeste de restore — modo "${detectarModo(argv)}"`)
console.log(`  Dump: ${path.relative(process.cwd(), dump)} (${(fs.statSync(dump).size / 1024 / 1024).toFixed(2)} MB)\n`)

try {
  const origem = await inspecionar(db.name)
  console.log(`  Origem (${db.name}): ${origem.existentes.length} tabela(s), ${origem.checks} CHECK(s)\n`)

  console.log(`Criando banco descartável ${BANCO_TESTE}…`)
  await rodarSql('postgres', `DROP DATABASE IF EXISTS ${BANCO_TESTE}`)
  await rodarSql('postgres', `CREATE DATABASE ${BANCO_TESTE}`)

  try {
    console.log('Restaurando o dump…')
    const { comando, args, ambiente } = comandoPgRestore(detectarModo(argv), BANCO_TESTE)
    executar({ comando, args, ambiente, entrada: fs.readFileSync(dump) })
    console.log('  ✔ pg_restore concluído\n')

    const restaurado = await inspecionar(BANCO_TESTE)

    const faltando = origem.existentes.filter((t) => !restaurado.existentes.includes(t))
    registrar(faltando.length === 0, `todas as tabelas restauradas${faltando.length ? ` (faltando: ${faltando.join(', ')})` : ''}`)

    const divergencias = origem.existentes.filter(
      (t) => origem.contagens[t] !== restaurado.contagens[t]
    )
    registrar(
      divergencias.length === 0,
      `contagens idênticas às da origem${divergencias.length ? ` (divergência: ${divergencias.map((t) => `${t}=${origem.contagens[t]}→${restaurado.contagens[t]}`).join(', ')})` : ''}`
    )

    registrar(
      restaurado.checks === origem.checks,
      `constraints CHECK restauradas (origem ${origem.checks} → restaurado ${restaurado.checks})`
    )

    registrar(
      restaurado.contagens.produtos >= 0 && restaurado.contagens.usuarios >= 0,
      `dados legíveis no banco restaurado (${restaurado.contagens.produtos ?? 0} produtos, ${restaurado.contagens.usuarios ?? 0} usuários)`
    )
  } finally {
    console.log(`\nRemovendo ${BANCO_TESTE}…`)
    await rodarSql('postgres', `DROP DATABASE IF EXISTS ${BANCO_TESTE}`).catch((err) =>
      console.warn(`  (aviso) não foi possível apagar o banco de teste: ${err.message}`)
    )
  }
} catch (err) {
  console.error(`\n  ✘ Erro no teste de restore: ${err.message}`)
  falhas.push(err.message)
}

if (falhas.length > 0) {
  console.error(`\nRESTORE FALHOU (${falhas.length}) — o backup atual NÃO é considerado válido:`)
  for (const f of falhas) console.error(`  - ${f}`)
  console.error('')
  process.exit(1)
}

console.log('\nRESTORE OK — o backup mais recente restaurou íntegro.\n')
