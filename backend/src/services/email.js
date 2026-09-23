import nodemailer from 'nodemailer'
import env from '../env.js'
import logger from '../logger.js'

function transporteConfigurado() {
  return Boolean(env.EMAIL_SMTP_USER && env.EMAIL_SMTP_PASS)
}

let transporte = null
function obterTransporte() {
  if (!transporte) {
    transporte = nodemailer.createTransport({
      host: env.EMAIL_SMTP_HOST,
      port: env.EMAIL_SMTP_PORT,
      secure: env.EMAIL_SMTP_PORT === 465,
      auth: { user: env.EMAIL_SMTP_USER, pass: env.EMAIL_SMTP_PASS },
    })
  }
  return transporte
}

export async function enviarEmail({ para, assunto, html, texto }) {
  if (!transporteConfigurado()) {
    logger.warn({ para, assunto }, 'SMTP não configurado — e-mail NÃO enviado (modo dev).')
    return { enviado: false, simulado: true }
  }
  await obterTransporte().sendMail({
    from: env.EMAIL_REMETENTE,
    to: para,
    subject: assunto,
    text: texto,
    html,
  })
  return { enviado: true, simulado: false }
}

export function templateCodigoVerificacao({ nome, codigo, expiraMinutos }) {
  const saudacao = nome ? `Olá, ${nome}!` : 'Olá!'
  const texto = `${saudacao}\n\nSeu código de verificação da Lume é: ${codigo}\n\nEle expira em ${expiraMinutos} minutos. Se você não criou esta conta, ignore este e-mail.`
  const html = `
    <div style="font-family:Georgia,serif;color:#1a1a1a;max-width:480px;margin:auto;padding:24px">
      <p style="font-size:16px">${saudacao}</p>
      <p style="font-size:15px">Use o código abaixo para verificar seu e-mail:</p>
      <p style="font-size:32px;letter-spacing:8px;font-weight:bold;text-align:center;background:#f6f4f1;padding:16px;border-radius:12px">${codigo}</p>
      <p style="font-size:13px;color:#666">Este código expira em ${expiraMinutos} minutos.<br/>Se você não criou esta conta, ignore este e-mail.</p>
    </div>`
  return { texto, html }
}

export function templateRedefinicaoSenha({ nome, codigo, expiraMinutos }) {
  const saudacao = nome ? `Olá, ${nome}!` : 'Olá!'
  const texto = `${saudacao}\n\nUse o código abaixo para redefinir sua senha da Lume: ${codigo}\n\nEle expira em ${expiraMinutos} minutos. Se você não pediu a troca da senha, ignore este e-mail — sua senha continua a mesma.`
  const html = `
    <div style="font-family:Georgia,serif;color:#1a1a1a;max-width:480px;margin:auto;padding:24px">
      <p style="font-size:16px">${saudacao}</p>
      <p style="font-size:15px">Use o código abaixo para redefinir sua senha:</p>
      <p style="font-size:32px;letter-spacing:8px;font-weight:bold;text-align:center;background:#f6f4f1;padding:16px;border-radius:12px">${codigo}</p>
      <p style="font-size:13px;color:#666">Este código expira em ${expiraMinutos} minutos.<br/>Se você não pediu a troca da senha, ignore este e-mail — sua senha continua a mesma.</p>
    </div>`
  return { texto, html }
}
