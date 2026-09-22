import pool from './db.js'
import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { produtos } from './data/produtos.js'

const { rows } = await pool.query('SELECT COUNT(*)::int AS total FROM produtos')
if (rows[0].total > 0) {
  console.log(`Produtos já existentes (${rows[0].total}). Nada a fazer.`)
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

// Admin inicial — credenciais vêm do .env (ADMIN_EMAIL/ADMIN_SENHA); se a
// senha não vier, gera uma forte e imprime uma única vez. Nunca senha fixa.
const adminEmail = process.env.ADMIN_EMAIL || 'admin@lume.com'
const senhaGerada = !process.env.ADMIN_SENHA
const adminSenha = process.env.ADMIN_SENHA || crypto.randomBytes(18).toString('base64url')

if (!adminEmail.includes('@')) {
  console.error('ADMIN_EMAIL inválido — defina um e-mail válido no backend/.env')
  process.exit(1)
}

const { rows: existente } = await pool.query('SELECT id FROM usuarios WHERE email = $1', [adminEmail])
if (existente.length === 0) {
  const senhaHash = bcrypt.hashSync(adminSenha, 10)
  await pool.query(
    `INSERT INTO usuarios (nome, email, senha_hash, admin)
     VALUES ($1, $2, $3, TRUE)`,
    ['Administrador', adminEmail, senhaHash]
  )
  console.log(`Admin criado: ${adminEmail}`)
  if (senhaGerada) {
    console.log(`Senha gerada (guarde e troque depois): ${adminSenha}`)
  }
} else {
  console.log(`Admin já existe (${adminEmail}).`)
}

await pool.end()
