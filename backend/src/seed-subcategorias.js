import pool from './db.js'
import { produtos } from './data/produtos.js'

// Subpastas do menu mobile (nicho > subpasta > produtos) e os renomes de nicho.
// Roda depois do seed.js/seed-generos.js e é idempotente: banco novo ou já
// popular termina com o mesmo estado. Os nomes das subpastas vivem em
// frontend/src/data/subcategorias.js; aqui só gravamos o id em `subcategoria`.
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

let inseridos = 0
let atualizados = 0

for (const p of produtos) {
  const subcategoria = p.subcategoria || ''
  const { rows: existentes } = await pool.query('SELECT id, subcategoria FROM produtos WHERE nome = $1', [p.nome])

  // Produto que sumiu do banco volta com os dados de demonstração (mesma
  // lógica do seed-generos.js, que repõe os nichos apagados).
  if (existentes.length === 0) {
    await pool.query(
      `INSERT INTO produtos (nome, genero, subcategoria, tipo, preco, estoque, permite_upload, descricao, imagem)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [p.nome, p.genero, subcategoria, p.tipo, p.preco, p.estoque, p.permiteUpload, p.descricao, p.imagem]
    )
    inseridos += 1
    continue
  }

  if (!subcategoria) continue

  for (const linha of existentes) {
    if (linha.subcategoria === subcategoria) continue
    await pool.query('UPDATE produtos SET subcategoria = $1 WHERE id = $2', [subcategoria, linha.id])
    atualizados += 1
  }
}

const { rows } = await pool.query('SELECT COUNT(*)::int AS total FROM produtos')
console.log(`Subpastas: ${inseridos} produto(s) inserido(s), ${atualizados} movido(s) de subpasta.`)
console.log(`Produtos no banco: ${rows[0].total}.`)

await pool.end()
