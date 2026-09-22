import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import pool from './db.js'
import logger from './logger.js'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@lume.com'
const ADMIN_NOME = process.env.ADMIN_NOME || 'Administrador'

if (!ADMIN_EMAIL.includes('@')) {
  console.error('ADMIN_EMAIL inválido — defina um e-mail válido no backend/.env')
  process.exit(1)
}

// A senha vem do .env (ADMIN_SENHA). Se não vier, gera uma forte e mostra
// uma única vez no terminal — nunca mais usar senha fixa no código.
const senhaGerada = !process.env.ADMIN_SENHA
const ADMIN_SENHA = process.env.ADMIN_SENHA || crypto.randomBytes(18).toString('base64url')

try {
  const { rows } = await pool.query('SELECT * FROM usuarios WHERE email = $1', [ADMIN_EMAIL])

  if (rows.length > 0) {
    if (!rows[0].admin) {
      await pool.query('UPDATE usuarios SET admin = TRUE WHERE email = $1', [ADMIN_EMAIL])
      console.log(`Usuário ${ADMIN_EMAIL} atualizado para admin.`)
    } else {
      console.log(`Usuário admin ${ADMIN_EMAIL} já existe.`)
    }
  } else {
    const senhaHash = bcrypt.hashSync(ADMIN_SENHA, 10)
    await pool.query(
      `INSERT INTO usuarios (nome, email, senha_hash, admin)
       VALUES ($1, $2, $3, TRUE)`,
      [ADMIN_NOME, ADMIN_EMAIL, senhaHash]
    )
    console.log(`Admin criado: ${ADMIN_EMAIL}`)
    console.log(
      senhaGerada
        ? `Senha gerada (guarde e troque depois): ${ADMIN_SENHA}`
        : 'Senha definida em ADMIN_SENHA do backend/.env.'
    )
  }
} catch (err) {
  logger.error({ err }, 'Erro ao criar admin')
  console.error('Erro ao criar admin:', err.message)
}

await pool.end()
