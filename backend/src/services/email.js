import fs from 'fs'
import path from 'path'
import tls from 'tls'
import { fileURLToPath } from 'url'
import nodemailer from 'nodemailer'
import env from '../env.js'
import logger from '../logger.js'

const raizBackend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

function transporteConfigurado() {
  return Boolean(env.EMAIL_SMTP_USER && env.EMAIL_SMTP_PASS)
}

// CA extra opcional (ex.: root de antivírus que intercepta TLS localmente).
// Nunca desliga a validação de certificado — só adiciona uma CA à lista padrão.
function carregarCaExtra() {
  if (!env.EMAIL_SMTP_EXTRA_CA) return null
  try {
    const caminho = path.isAbsolute(env.EMAIL_SMTP_EXTRA_CA)
      ? env.EMAIL_SMTP_EXTRA_CA
      : path.resolve(raizBackend, env.EMAIL_SMTP_EXTRA_CA)
    return fs.readFileSync(caminho, 'utf8')
  } catch (err) {
    logger.warn(
      { err: err.message, caminho: env.EMAIL_SMTP_EXTRA_CA },
      'Falha ao carregar EMAIL_SMTP_EXTRA_CA — SMTP seguirá sem a CA extra.'
    )
    return null
  }
}

let transporte = null
function obterTransporte() {
  if (!transporte) {
    const opcoes = {
      host: env.EMAIL_SMTP_HOST,
      port: env.EMAIL_SMTP_PORT,
      secure: env.EMAIL_SMTP_PORT === 465,
      auth: {
        user: env.EMAIL_SMTP_USER,
        // Senhas de app do Gmail vêm com espaços; o SMTP espera sem espaços.
        pass: String(env.EMAIL_SMTP_PASS).replace(/\s+/g, ''),
      },
    }
    const caExtra = carregarCaExtra()
    if (caExtra) {
      opcoes.tls = { ca: [...tls.rootCertificates, caExtra] }
    }
    transporte = nodemailer.createTransport(opcoes)
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
