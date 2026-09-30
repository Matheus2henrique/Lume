import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pool from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')

// O schema usa RAISE NOTICE quando uma constraint precisa ser adiada por
// dados legados — sem isto, o aviso sumiria e a restrição passaria despercebida.
const client = await pool.connect()
client.on('notice', (aviso) => {
  console.log(`  ! ${aviso.message}`)
})

try {
  await client.query(schema)
  console.log('Schema aplicado com sucesso no PostgreSQL.')
} finally {
  client.release()
  await pool.end()
}
