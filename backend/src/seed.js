import pool from './db.js'
import { produtos } from './data/produtos.js'

const { rowCount } = await pool.query('SELECT COUNT(*)::int AS total FROM produtos')
if (rowCount[0].total > 0) {
  console.log(`Produtos já existentes (${rowCount[0].total}). Nada a fazer.`)
} else {
  for (const p of produtos) {
    await pool.query(
      `INSERT INTO produtos (nome, genero, tipo, preco, estoque, permite_upload, descricao, imagem)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [p.nome, p.genero, p.tipo, p.preco, p.estoque, p.permiteUpload, p.descricao, p.imagem]
    )
  }
  console.log(`Seed concluído: ${produtos.length} produtos inseridos.`)
}

await pool.end()