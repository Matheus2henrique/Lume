import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../db.js'
import { autenticar } from '../middleware/auth.js'

const router = Router()

function tokenPara(usuario) {
  return jwt.sign({ id: usuario.id, email: usuario.email }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  })
}

function publico(usuario) {
  return { id: usuario.id, nome: usuario.nome, email: usuario.email, provedor: usuario.provedor }
}

router.post('/registrar', async (req, res) => {
  const { nome, email, senha } = req.body || {}

  if (!email || !email.includes('@')) {
    return res.status(400).json({ erro: 'Informe um e-mail válido.' })
  }
  if (!senha || String(senha).length < 6) {
    return res.status(400).json({ erro: 'A senha deve ter pelo menos 6 caracteres.' })
  }

  try {
    const senhaHash = bcrypt.hashSync(String(senha), 10)
    const resultado = await pool.query(
      `INSERT INTO usuarios (nome, email, senha_hash)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [nome?.trim() || '', email, senhaHash]
    )
    const usuario = resultado.rows[0]
    res.status(201).json({ usuario: publico(usuario), token: tokenPara(usuario) })
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ erro: 'Já existe uma conta com este e-mail.' })
    }
    console.error(err)
    res.status(500).json({ erro: 'Não foi possível criar a conta.' })
  }
})

router.post('/login', async (req, res) => {
  const { email, senha } = req.body || {}

  if (!email || !senha) {
    return res.status(400).json({ erro: 'Informe e-mail e senha.' })
  }

  try {
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email])
    const usuario = rows[0]
    if (!usuario || !bcrypt.compareSync(String(senha), usuario.senha_hash)) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' })
    }
    res.json({ usuario: publico(usuario), token: tokenPara(usuario) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Não foi possível entrar.' })
  }
})

router.get('/perfil', autenticar, (req, res) => {
  res.json({ usuario: publico(req.usuario) })
})

export default router