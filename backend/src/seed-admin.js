import bcrypt from 'bcryptjs'
import pool from './db.js'
import logger from './logger.js'

const ADMIN_EMAIL = 'admin@teste'
const ADMIN_SENHA = '123456'
const ADMIN_NOME = 'Administrador'

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
    console.log(`Admin criado: ${ADMIN_EMAIL} / ${ADMIN_SENHA}`)
  }
} catch (err) {
  logger.error({ err }, 'Erro ao criar admin')
  console.error('Erro ao criar admin:', err.message)
}

await pool.end()
