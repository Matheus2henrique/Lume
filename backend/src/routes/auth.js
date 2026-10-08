import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'
import pool from '../db.js'
import { autenticar } from '../middleware/auth.js'
import {
  limiterAuth,
  limiterReenvio,
  limiterLogin,
  limiterConta,
  contaBloqueada,
  registrarFalhaDeConta,
  limparFalhasDeConta,
} from '../middleware/rateLimiter.js'
import {
  enviarEmail,
  logarCodigoSimulado,
  templateCodigoVerificacao,
  templateRedefinicaoSenha,
} from '../services/email.js'
import { verificarIdTokenGoogle } from '../services/google.js'
import { removerContaPendente } from '../services/limpeza.js'
import logger from '../logger.js'

const router = Router()

const EXPIRA_MINUTOS = 10
const MAX_TENTATIVAS = 5

function tokenPara(usuario) {
  // `tv` (token_version) permite invalidar a sessão inteira no servidor:
  // incrementar a coluna derruba todos os tokens já emitidos.
  return jwt.sign(
    { id: usuario.id, email: usuario.email, tv: usuario.token_version ?? 0 },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
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

function contaExpirada() {
  return {
    erro: 'O prazo de verificação expirou e a conta foi removida. Cadastre-se novamente.',
    contaExpirada: true,
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
      // Modo dev (sem SMTP): loga o código — nunca em produção.
      logarCodigoSimulado('verificação', codigo, { userId: usuario.id })
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
      novaConta: true,
      email: usuario.email,
      emailEnviado: envio.enviado,
      expiraEmMinutos: EXPIRA_MINUTOS,
    })
  } catch (err) {
    if (err.code === '23505') {
      // Conta já existe (verificada ou pendente): só avisa. A conta pendente
      // continua acessível pelo login, que reemite o código de verificação.
      return res.status(409).json({ erro: 'Este e-mail já foi cadastrado.' })
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
      // Prazo estourado: apaga a conta pendente e avisa o front (410 Gone).
      await removerContaPendente(usuario.id)
      logger.info({ userId: usuario.id }, 'Conta pendente removida (código expirado)')
      return res.status(410).json(contaExpirada())
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
      const expirado =
        !usuario.codigo_expira_em || new Date() > new Date(usuario.codigo_expira_em)
      if (expirado) {
        // Reenvio depois do prazo: conta pendente vencida sai do banco.
        await removerContaPendente(usuario.id)
        logger.info({ userId: usuario.id }, 'Conta pendente removida ao reenviar (prazo expirado)')
      } else {
        await emitirCodigoVerificacao(usuario)
      }
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

// limiterLogin conta só erro (skipSuccessfulRequests); limiterConta trava a
// conta alvo mesmo quando o atacante troca de IP.
router.post('/login', limiterLogin, limiterConta, async (req, res) => {
  const { email, senha } = req.body || {}

  if (!email || !senha) {
    return res.status(400).json({ erro: 'Informe e-mail e senha.' })
  }
  if (!email.includes('@')) {
    return res.status(400).json({ erro: 'Informe um e-mail válido.' })
  }

  try {
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email])
    const usuario = rows[0]

    // O login só entra em conta que já existe: quem não tem cadastro precisa
    // criar a conta na tela /criar-conta (nada de criar conta pendente aqui).
    if (!usuario) {
      return res.status(401).json({ erro: 'Esta conta não existe. Crie sua conta para entrar.' })
    }

    // Conta Google não tem senha local (senha_hash NULL): nunca compara.
    if (!usuario.senha_hash || !bcrypt.compareSync(String(senha), usuario.senha_hash)) {
      registrarFalhaDeConta(email)
      if (contaBloqueada(email)) {
        logger.warn({ userId: usuario.id }, 'Conta bloqueada após tentativas de login')
        return res
          .status(429)
          .json({ erro: 'Muitas tentativas para esta conta. Aguarde alguns minutos.' })
      }
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' })
    }

    if (!usuario.email_verificado) {
      // Prazo dos 10 min estourado: conta some do banco e o front manda pra home.
      const expirado =
        !usuario.codigo_expira_em || new Date() > new Date(usuario.codigo_expira_em)
      if (expirado) {
        await removerContaPendente(usuario.id)
        logger.info({ userId: usuario.id }, 'Conta pendente removida no login (prazo expirado)')
        return res.status(410).json(contaExpirada())
      }

      // Conta pendente (criada no /registrar): reemite um código válido no
      // e-mail antes de liberar a entrada.
      const envio = await emitirCodigoVerificacao(usuario)
      return res.status(403).json({
        erro: 'Confirme o código enviado para o seu e-mail antes de entrar.',
        requerVerificacao: true,
        novaConta: false,
        email: usuario.email,
        emailEnviado: envio.enviado,
        expiraEmMinutos: EXPIRA_MINUTOS,
      })
    }

    logger.info({ userId: usuario.id }, 'Login realizado')
    limparFalhasDeConta(email)
    res.json({ usuario: publico(usuario), token: tokenPara(usuario) })
  } catch (err) {
    logger.error({ err }, 'Erro ao fazer login')
    res.status(500).json({ erro: 'Não foi possível entrar.' })
  }
})

// Login/registro com Google: o front manda o ID token do Google Identity
// Services e a gente só cria sessão depois de validar assinatura e audiência.
// Conta nova nasce SEM senha (senha_hash NULL) e já verificada; conta local
// existente e verificada com o mesmo e-mail é AVENTADA (vínculo decidido).
router.post('/google', limiterAuth, async (req, res) => {
  const credential = req.body?.credential
  if (!credential) {
    return res.status(400).json({ erro: 'Credencial do Google ausente.' })
  }

  let payload
  try {
    payload = await verificarIdTokenGoogle(credential)
  } catch (err) {
    if (err.naoConfigurado) {
      return res.status(503).json({ erro: 'Login com Google não configurado no servidor.' })
    }
    // Nunca logar o credential — só o fato da recusa.
    logger.warn('ID token do Google recusado')
    return res.status(401).json({ erro: 'Não foi possível validar o login com Google.' })
  }

  const email = String(payload?.email || '').trim().toLowerCase()
  const nomeGoogle = String(payload?.name || '').trim()
  if (!email || !email.includes('@')) {
    return res.status(401).json({ erro: 'O Google não devolveu um e-mail válido.' })
  }
  if (!payload?.email_verified) {
    return res.status(403).json({ erro: 'O Google não confirmou a verificação deste e-mail.' })
  }

  try {
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE lower(email) = lower($1)', [
      email,
    ])
    let usuario = rows[0]

    if (usuario && !usuario.email_verificado) {
      // Conta pendente: pode ter sido cadastrada por terceiro com o e-mail
      // desta pessoa — não adota. Quem é dono confirma o código no próprio
      // e-mail e aí sim o Google passa a entrar normalmente.
      return res.status(403).json({
        erro:
          'Existe uma conta para este e-mail aguardando verificação. ' +
          'Confirme o código enviado a ele antes de entrar com Google.',
      })
    }

    if (!usuario) {
      try {
        const criado = await pool.query(
          `INSERT INTO usuarios (nome, email, senha_hash, provedor, email_verificado)
           VALUES ($1, $2, NULL, 'google', TRUE)
           RETURNING *`,
          [nomeGoogle || email.split('@')[0], email]
        )
        usuario = criado.rows[0]
        logger.info({ userId: usuario.id }, 'Conta criada via Google')
      } catch (erroInsert) {
        if (erroInsert.code !== '23505') throw erroInsert
        // Corrida: outra requisição criou a conta instantes atrás.
        const deNovo = await pool.query(
          'SELECT * FROM usuarios WHERE lower(email) = lower($1)',
          [email]
        )
        usuario = deNovo.rows[0]
        if (!usuario) throw erroInsert
      }
    } else {
      logger.info({ userId: usuario.id }, 'Login com Google em conta existente (vínculo)')
    }

    res.json({ usuario: publico(usuario), token: tokenPara(usuario) })
  } catch (err) {
    logger.error({ err }, 'Erro no login com Google')
    res.status(500).json({ erro: 'Não foi possível entrar com o Google.' })
  }
})

// Esqueci minha senha: envia um código de redefinição por e-mail.
// Resposta sempre genérica — não revela se a conta existe.
router.post('/esqueci-senha', limiterReenvio, async (req, res) => {
  const { email } = req.body || {}

  if (!email || !email.includes('@')) {
    return res.status(400).json({ erro: 'Informe um e-mail válido.' })
  }

  try {
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email])
    const usuario = rows[0]

    // Só quem já confirmou o e-mail pode trocar a senha
    // (quem não confirmou continua no fluxo de verificação normal).
    if (usuario && usuario.email_verificado) {
      const codigo = gerarCodigo()
      const expiraEm = new Date(Date.now() + EXPIRA_MINUTOS * 60 * 1000)
      await pool.query(
        `UPDATE usuarios
         SET reset_hash = $1,
             reset_expira_em = $2,
             reset_tentativas = 0
         WHERE id = $3`,
        [hashCodigo(codigo), expiraEm, usuario.id]
      )

      const { texto, html } = templateRedefinicaoSenha({
        nome: usuario.nome,
        codigo,
        expiraMinutos: EXPIRA_MINUTOS,
      })
      try {
        const envio = await enviarEmail({
          para: usuario.email,
          assunto: 'Redefinição de senha — Lume',
          texto,
          html,
        })
        if (envio.simulado) {
          // Modo dev (sem SMTP): loga o código — nunca em produção.
          logarCodigoSimulado('redefinição de senha', codigo, { userId: usuario.id })
        }
      } catch (err) {
        logger.error({ err, userId: usuario.id }, 'Falha ao enviar e-mail de redefinição')
      }
      logger.info({ userId: usuario.id }, 'Código de redefinição de senha emitido')
    }

    res.json({
      mensagem: 'Se existir uma conta com este e-mail, enviamos um código para redefinir a senha.',
      expiraEmMinutos: EXPIRA_MINUTOS,
    })
  } catch (err) {
    logger.error({ err }, 'Erro ao solicitar redefinição de senha')
    res.status(500).json({ erro: 'Não foi possível processar a solicitação.' })
  }
})

// Troca a senha validando o código enviado em /esqueci-senha.
router.post('/redefinir-senha', limiterAuth, async (req, res) => {
  const { email, codigo, senha } = req.body || {}

  if (!email || !codigo || !senha) {
    return res.status(400).json({ erro: 'Informe o e-mail, o código e a nova senha.' })
  }
  if (!/^\d{4,6}$/.test(String(codigo))) {
    return res.status(400).json({ erro: 'O código deve ter de 4 a 6 dígitos.' })
  }
  if (String(senha).length < 6) {
    return res.status(400).json({ erro: 'A senha deve ter pelo menos 6 caracteres.' })
  }

  try {
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email])
    const usuario = rows[0]
    if (!usuario || !usuario.reset_hash) {
      return res.status(400).json({ erro: 'Código inválido ou expirado. Solicite um novo.' })
    }
    if (usuario.reset_tentativas >= MAX_TENTATIVAS) {
      return res.status(429).json({ erro: 'Muitas tentativas. Solicite um novo código.' })
    }
    if (!usuario.reset_expira_em || new Date() > new Date(usuario.reset_expira_em)) {
      return res.status(400).json({ erro: 'Código expirado. Solicite um novo código.' })
    }
    if (hashCodigo(codigo) !== usuario.reset_hash) {
      await pool.query('UPDATE usuarios SET reset_tentativas = reset_tentativas + 1 WHERE id = $1', [
        usuario.id,
      ])
      return res.status(400).json({ erro: 'Código incorreto.' })
    }

    const senhaHash = bcrypt.hashSync(String(senha), 10)
    await pool.query(
      `UPDATE usuarios
       SET senha_hash = $1,
           reset_hash = NULL,
           reset_expira_em = NULL,
           reset_tentativas = 0,
           token_version = token_version + 1
       WHERE id = $2`,
      [senhaHash, usuario.id]
    )
    logger.info({ userId: usuario.id }, 'Senha redefinida com sucesso')
    res.json({ mensagem: 'Senha alterada com sucesso. Faça login com a nova senha.' })
  } catch (err) {
    logger.error({ err }, 'Erro ao redefinir senha')
    res.status(500).json({ erro: 'Não foi possível redefinir a senha.' })
  }
})

// Encerra a sessão no servidor: incrementa token_version e invalida TODOS os
// tokens já emitidos (todos os dispositivos) — mais barato que lista negra.
router.post('/logout', autenticar, async (req, res) => {
  try {
    await pool.query('UPDATE usuarios SET token_version = token_version + 1 WHERE id = $1', [
      req.usuario.id,
    ])
    logger.info({ userId: req.usuario.id }, 'Sessões do usuário invalidadas')
    res.json({ mensagem: 'Sessão encerrada em todos os dispositivos.' })
  } catch (err) {
    logger.error({ err }, 'Erro ao encerrar sessão')
    res.status(500).json({ erro: 'Não foi possível encerrar a sessão.' })
  }
})

// LGPD — exclusão da conta e dos dados pessoais.
// • os pedidos ficam (obrigação fiscal), mas desvinculados e anonimizados;
// • o cadastro de contato some, a menos que outro pedido ainda o use;
// • a inscrição na newsletter sai junto (opt-out);
// • token_version sobe: qualquer sessão aberta morre na hora.
router.delete('/dados', autenticar, async (req, res) => {
  if (req.usuario.admin) {
    return res
      .status(403)
      .json({ erro: 'A conta de administradora não pode ser excluída por aqui.' })
  }

  const email = String(req.usuario.email).trim()
  const { confirmacao } = req.body || {}
  if (String(confirmacao || '').trim().toLowerCase() !== email.toLowerCase()) {
    return res.status(400).json({ erro: 'Confirme seu e-mail para excluir a conta.' })
  }

  let client = null
  try {
    client = await pool.connect()
    await client.query('BEGIN')

    await client.query(
      `UPDATE pedidos
       SET usuario_id = NULL,
           cliente_id = NULL,
           cliente_dados = jsonb_build_object(
             'nome', 'Cliente removido',
             'email', 'removido@privacidade',
             'telefone', '',
             'endereco', ''
           )
       WHERE usuario_id = $1`,
      [req.usuario.id]
    )
    await client.query(
      `DELETE FROM clientes c
       WHERE lower(c.email) = lower($1)
         AND NOT EXISTS (SELECT 1 FROM pedidos p WHERE p.cliente_id = c.id)`,
      [email]
    )
    await client.query('DELETE FROM newsletter WHERE lower(email) = lower($1)', [email])
    await client.query('UPDATE usuarios SET token_version = token_version + 1 WHERE id = $1', [
      req.usuario.id,
    ])
    await client.query('DELETE FROM usuarios WHERE id = $1', [req.usuario.id])

    await client.query('COMMIT')
    logger.info({ userId: req.usuario.id }, 'Conta excluída (LGPD)')
    res.json({ mensagem: 'Conta e dados pessoais excluídos.' })
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {})
    logger.error({ err }, 'Erro ao excluir conta')
    res.status(500).json({ erro: 'Não foi possível excluir a conta.' })
  } finally {
    client?.release()
  }
})

router.get('/perfil', autenticar, (req, res) => {
  res.json({ usuario: publico(req.usuario) })
})

// Altera o nome de quem está logado (tela de conta).
router.put('/perfil', autenticar, async (req, res) => {
  const nome = String(req.body?.nome ?? '').trim()

  if (!nome) {
    return res.status(400).json({ erro: 'Informe seu nome.' })
  }
  if (nome.length > 80) {
    return res.status(400).json({ erro: 'O nome pode ter no máximo 80 caracteres.' })
  }

  try {
    const { rows } = await pool.query(
      'UPDATE usuarios SET nome = $1 WHERE id = $2 RETURNING *',
      [nome, req.usuario.id]
    )
    logger.info({ userId: req.usuario.id }, 'Nome alterado pela conta logada')
    res.json({ usuario: publico(rows[0]) })
  } catch (err) {
    logger.error({ err }, 'Erro ao alterar nome')
    res.status(500).json({ erro: 'Não foi possível atualizar o nome.' })
  }
})

// Troca a senha de quem está logado: exige a senha atual e incrementa
// token_version (derruba as outras sessões), devolvendo um token novo para a
// sessão atual continuar conectada.
router.put('/senha', limiterAuth, autenticar, async (req, res) => {
  const { senhaAtual, novaSenha } = req.body || {}

  if (!senhaAtual || !novaSenha) {
    return res.status(400).json({ erro: 'Informe a senha atual e a nova senha.' })
  }
  if (String(novaSenha).length < 6) {
    return res.status(400).json({ erro: 'A nova senha deve ter pelo menos 6 caracteres.' })
  }
  if (String(senhaAtual) === String(novaSenha)) {
    return res.status(400).json({ erro: 'A nova senha deve ser diferente da atual.' })
  }

  try {
    const usuario = req.usuario
    const confere =
      Boolean(usuario.senha_hash) && bcrypt.compareSync(String(senhaAtual), usuario.senha_hash)
    if (!confere) {
      return res.status(400).json({ erro: 'A senha atual está incorreta.' })
    }

    const senhaHash = bcrypt.hashSync(String(novaSenha), 10)
    const { rows } = await pool.query(
      `UPDATE usuarios
       SET senha_hash = $1,
           token_version = token_version + 1
       WHERE id = $2
       RETURNING *`,
      [senhaHash, usuario.id]
    )
    const atualizado = rows[0]
    logger.info({ userId: usuario.id }, 'Senha alterada pela conta logada')
    res.json({ token: tokenPara(atualizado), usuario: publico(atualizado) })
  } catch (err) {
    logger.error({ err }, 'Erro ao alterar senha')
    res.status(500).json({ erro: 'Não foi possível alterar a senha.' })
  }
})

export default router
