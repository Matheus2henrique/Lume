import pool from './db.js'
import { subcategorias } from './data/subcategorias.js'

// Subpastas do menu mobile (nicho > subpasta) e os renomes de nicho.
// Roda depois do seed.js/seed-generos.js e é idempotente: banco novo ou já
// popular termina com o mesmo estado. Os nomes das subpastas vivem em
// frontend/src/data/subcategorias.js. Produtos não são mais semeados — o
// catálogo é preenchido pelo admin no painel.
const RENOMES = [
  { id: 'brinq-sensorial', de: 'Brinq. Sensorial', para: 'Sensoriais' },
  { id: 'livro', de: 'Livro', para: 'Livros' },
  { id: 'dinossauros', de: 'Dinossauros', para: 'Coleção Dinossauro' },
  { id: 'dinossauros', de: 'Coleção DinoFosseis', para: 'Coleção Dinossauro' },
]

// Banco criado antes da migração (ver schema.sql) não tem a coluna ainda.
await pool.query(`ALTER TABLE produtos ADD COLUMN IF NOT EXISTS subcategoria TEXT NOT NULL DEFAULT ''`)

for (const { id, de, para } of RENOMES) {
  const { rowCount } = await pool.query('UPDATE generos SET nome = $1 WHERE id = $2 AND nome = $3', [para, id, de])
  if (rowCount > 0) console.log(`Nicho renomeado: ${de} -> ${para}`)
}

// Colecionáveis e Dinossauros são o mesmo nicho: os produtos passam a valer
// dinossauros e o nicho antigo sai da lista (o seed-generos.js não o insere
// de volta, porque ele saiu da lista de padrão).
const { rowCount: movidos } = await pool.query(
  `UPDATE produtos SET genero = 'dinossauros' WHERE genero = 'colecionaveis'`
)
if (movidos > 0) console.log(`${movidos} produto(s) movido(s) de colecionaveis para dinossauros.`)

const { rowCount: removidos } = await pool.query(`DELETE FROM generos WHERE id = 'colecionaveis'`)
if (removidos > 0) console.log('Nicho removido: Colecionáveis (agora é Coleção Dinossauro).')

// Definições das subpastas (nome/ícone/descrição) — o que falta é inserido,
// o que o admin já renomeou/reordenou fica como está.
let subPastasInseridas = 0
for (const s of subcategorias) {
  const { rowCount } = await pool.query(
    `INSERT INTO subcategorias (id, genero, nome, icone, descricao, ordem)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO NOTHING`,
    [s.id, s.genero, s.nome, s.icone, s.descricao, s.ordem]
  )
  subPastasInseridas += rowCount
}
console.log(`Subpastas: ${subPastasInseridas} definição(ões) inserida(s).`)

const { rows } = await pool.query('SELECT COUNT(*)::int AS total FROM produtos')
console.log(`Produtos no banco: ${rows[0].total}.`)

await pool.end()
