import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'
import pool from '../db.js'
import { autenticar } from '../middleware/auth.js'
import { limiterAuth, limiterReenvio } from '../middleware/rateLimiter.js'
import { enviarEmail, templateCodigoVerificacao } from '../services/email.js'
import logger from '../logger.js'

const router = Router()

const EXPIRA_MINUTOS = 10
const MAX_TENTATIVAS = 5

function tokenPara(usuario) {
  return jwt.sign({ id: usuario.id, email: usuario.email }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  })
}

function publico(usuario) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    provedor: usuario.provedor,
    admin: Boolean(usuario.admin),
    emailVerificado: Boolean(usuario.email_verificado),
  }
}

// Código de 4 a 6 dígitos (tamanho sorteado a cada envio).
function gerarCodigo() {
  const digitos = crypto.randomInt(4, 7) // 4, 5 ou 6
  return String(crypto.randomInt(10 ** (digitos - 1), 10 ** digitos))
}

function hashCodigo(codigo) {
  return crypto.createHmac('sha256', process.env.JWT_SECRET).update(String(codigo)).digest('hex')
}

async function enviarCodigoEmail(usuario, codigo) {
  const { texto, html } = templateCodigoVerificacao({
    nome: usuario.nome,
    codigo,
    expiraMinutos: EXPIRA_MINUTOS,
  })
  try {
    const resultado = await enviarEmail({
      para: usuario.email,
      assunto: 'Código de verificação — Lume',
      texto,
      html,
    })
    if (resultado.simulado) {
      // Modo dev (sem SMTP): loga o código para testar o fluxo local.
      logger.warn({ userId: usuario.id }, `Código de verificação (dev): ${codigo}`)
    }
    return resultado
  } catch (err) {
    logger.error({ err, userId: usuario.id }, 'Falha ao enviar e-mail de verificação')
    return { enviado: false, simulado: false }
  }
}

async function emitirCodigoVerificacao(usuario) {
  const codigo = gerarCodigo()
  const expiraEm = new Date(Date.now() + EXPIRA_MINUTOS * 60 * 1000)
  await pool.query(
    `UPDATE usuarios
     SET codigo_verificacao_hash = $1,
         codigo_expira_em = $2,
         codigo_tentativas = 0
     WHERE id = $3`,
    [hashCodigo(codigo), expiraEm, usuario.id]
  )
  return enviarCodigoEmail(usuario, codigo)
}

router.post('/registrar', limiterAuth, async (req, res) => {
  const { nome, email, senha } = req.body || {}

  if (!email || !email.includes('@')) {
    return res.status(400).json({ erro: 'Informe um e-mail válido.' })
  }
  if (!senha || String(senha).length < 6) {
    return res.status(400).json({ erro: 'A senha deve ter pelo menos 6 caracteres.' })
  }

  try {
    const senhaHash = bcrypt.hashSync(String(senha), 10)
    const codigo = gerarCodigo()
    const expiraEm = new Date(Date.now() + EXPIRA_MINUTOS * 60 * 1000)
    const resultado = await pool.query(
      `INSERT INTO usuarios (nome, email, senha_hash, email_verificado, codigo_verificacao_hash, codigo_expira_em, codigo_tentativas)
       VALUES ($1, $2, $3, FALSE, $4, $5, 0)
       RETURNING *`,
      [nome?.trim() || '', email, senhaHash, hashCodigo(codigo), expiraEm]
    )
    const usuario = resultado.rows[0]
    logger.info({ userId: usuario.id }, 'Novo usuário registrado (aguardando verificação de e-mail)')

    const envio = await enviarCodigoEmail(usuario, codigo)

    res.status(201).json({
      requerVerificacao: true,
      email: usuario.email,
      emailEnviado: envio.enviado,
      expiraEmMinutos: EXPIRA_MINUTOS,
    })
  } catch (err) {
    if (err.code === '23505') {
      // Conta já existe: se ainda não verificou, emite um código novo
      // (quem tentou registrar de novo após falha de envio não fica preso).
      try {
        const { rows } = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email])
        const existente = rows[0]
        if (existente && !existente.email_verificado) {
          const envio = await emitirCodigoVerificacao(existente)
          logger.info({ userId: existente.id }, 'Reemissão de código para conta não verificada')
          return res.status(201).json({
            requerVerificacao: true,
            email: existente.email,
            emailEnviado: envio.enviado,
            expiraEmMinutos: EXPIRA_MINUTOS,
          })
        }
      } catch (erroInterno) {
        logger.error({ err: erroInterno }, 'Erro ao reemitir código de verificação')
      }
      return res.status(409).json({ erro: 'Já existe uma conta com este e-mail.' })
    }
    logger.error({ err }, 'Erro ao registrar usuário')
    res.status(500).json({ erro: 'Não foi possível criar a conta.' })
  }
})

router.post('/verificar', limiterAuth, async (req, res) => {
  const { email, codigo } = req.body || {}

  if (!email || !codigo) {
    return res.status(400).json({ erro: 'Informe o e-mail e o código de verificação.' })
  }
  if (!/^\d{4,6}$/.test(String(codigo))) {
    return res.status(400).json({ erro: 'O código deve ter de 4 a 6 dígitos.' })
  }

  try {
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email])
    const usuario = rows[0]
    if (!usuario) {
      return res.status(400).json({ erro: 'Código inválido ou expirado.' })
    }
    if (usuario.email_verificado) {
      return res.json({ usuario: publico(usuario), token: tokenPara(usuario) })
    }
    if (usuario.codigo_tentativas >= MAX_TENTATIVAS) {
      return res.status(429).json({ erro: 'Muitas tentativas. Solicite um novo código.' })
    }
    if (!usuario.codigo_expira_em || new Date() > new Date(usuario.codigo_expira_em)) {
      return res.status(400).json({ erro: 'Código expirado. Solicite um novo código.' })
    }
    if (hashCodigo(codigo) !== usuario.codigo_verificacao_hash) {
      await pool.query('UPDATE usuarios SET codigo_tentativas = codigo_tentativas + 1 WHERE id = $1', [
        usuario.id,
      ])
      return res.status(400).json({ erro: 'Código incorreto.' })
    }

    await pool.query(
      `UPDATE usuarios
       SET email_verificado = TRUE,
           codigo_verificacao_hash = NULL,
           codigo_expira_em = NULL,
           codigo_tentativas = 0
       WHERE id = $1`,
      [usuario.id]
    )
    const verificado = { ...usuario, email_verificado: true }
    logger.info({ userId: usuario.id }, 'E-mail verificado')
    res.json({ usuario: publico(verificado), token: tokenPara(verificado) })
  } catch (err) {
    logger.error({ err }, 'Erro ao verificar código')
    res.status(500).json({ erro: 'Não foi possível verificar o código.' })
  }
})

router.post('/reenviar-verificacao', limiterReenvio, async (req, res) => {
  const { email } = req.body || {}

  if (!email || !email.includes('@')) {
    return res.status(400).json({ erro: 'Informe um e-mail válido.' })
  }

  try {
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email])
    const usuario = rows[0]
    if (usuario && !usuario.email_verificado) {
      await emitirCodigoVerificacao(usuario)
    }
    // Resposta genérica: não revela se a conta existe ou já foi verificada.
    res.json({
      mensagem: 'Se existir uma conta pendente, um novo código foi enviado para este e-mail.',
    })
  } catch (err) {
    logger.error({ err }, 'Erro ao reenviar código de verificação')
    res.status(500).json({ erro: 'Não foi possível reenviar o código.' })
  }
})

router.post('/login', limiterAuth, async (req, res) => {
  const { email, senha } = req.body || {}

  if (!email || !senha) {
    return res.status(400).json({ erro: 'Informe e-mail e senha.' })
  }

  try {
    let { rows } = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email])
    let usuario = rows[0]
    let contaNova = false
    let codigoNovo = null

    // E-mail ainda cadastrado: cria a conta como PENDENTE e envia o código.
    // Ela só passa a existir de fato quando o código enviado for confirmado.
    if (!usuario) {
      if (!email.includes('@')) {
        return res.status(400).json({ erro: 'Informe um e-mail válido.' })
      }
      if (String(senha).length < 6) {
        return res.status(400).json({ erro: 'A senha deve ter pelo menos 6 caracteres.' })
      }

      const senhaHash = bcrypt.hashSync(String(senha), 10)
      codigoNovo = gerarCodigo()
      const expiraEm = new Date(Date.now() + EXPIRA_MINUTOS * 60 * 1000)
      try {
        const criado = await pool.query(
          `INSERT INTO usuarios (nome, email, senha_hash, email_verificado, codigo_verificacao_hash, codigo_expira_em, codigo_tentativas)
           VALUES ($1, $2, $3, FALSE, $4, $5, 0)
           RETURNING *`,
          [String(email).split('@')[0], email, senhaHash, hashCodigo(codigoNovo), expiraEm]
        )
        usuario = criado.rows[0]
        contaNova = true
        logger.info({ userId: usuario.id }, 'Conta criada pela tela de Entrar (aguardando código)')
      } catch (erroInsert) {
        if (erroInsert.code !== '23505') throw erroInsert
        // Corrida: outra requisição criou a conta instantes atrás — segue o fluxo normal.
        const deNovo = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email])
        usuario = deNovo.rows[0]
        codigoNovo = null
        if (!usuario) throw erroInsert
      }
    }

    if (!bcrypt.compareSync(String(senha), usuario.senha_hash)) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' })
    }

    if (!usuario.email_verificado) {
      // Conta pendente: garante um código válido no e-mail antes de liberar.
      const envio = contaNova && codigoNovo
        ? await enviarCodigoEmail(usuario, codigoNovo)
        : await emitirCodigoVerificacao(usuario)
      return res.status(contaNova ? 201 : 403).json({
        erro: 'Confirme o código enviado para o seu e-mail antes de entrar.',
        requerVerificacao: true,
        novaConta: contaNova,
        email: usuario.email,
        emailEnviado: envio.enviado,
        expiraEmMinutos: EXPIRA_MINUTOS,
      })
    }

    logger.info({ userId: usuario.id }, 'Login realizado')
    res.json({ usuario: publico(usuario), token: tokenPara(usuario) })
  } catch (err) {
    logger.error({ err }, 'Erro ao fazer login')
    res.status(500).json({ erro: 'Não foi possível entrar.' })
  }
})

router.get('/perfil', autenticar, (req, res) => {
  res.json({ usuario: publico(req.usuario) })
})

export default router
