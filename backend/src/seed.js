import pool from './db.js'
import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'

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
  // email_verificado = TRUE: a conta nasce pronta para login (ver
  // src/seed-admin.js — sem isso a limpeza apaga o admin em <= 60 s).
  await pool.query(
    `INSERT INTO usuarios (nome, email, senha_hash, admin, email_verificado)
     VALUES ($1, $2, $3, TRUE, TRUE)`,
    ['Administrador', adminEmail, senhaHash]
  )
  console.log(`Admin criado: ${adminEmail}`)
  if (senhaGerada) {
    console.log(`Senha gerada (guarde e troque depois): ${adminSenha}`)
  }
} else {
  // Repara contas de seeds antigos que nasceram sem verificação e seriam
  // apagadas pela rotina de limpeza (ver src/seed-admin.js).
  await pool.query(
    'UPDATE usuarios SET email_verificado = TRUE WHERE email = $1 AND admin = TRUE AND email_verificado = FALSE',
    [adminEmail]
  )
  console.log(`Admin já existe (${adminEmail}).`)
}

await pool.end()
