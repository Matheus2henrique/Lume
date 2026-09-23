import 'dotenv/config'
import nodemailer from 'nodemailer'

// Não imprime segredos — só o resultado.
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST,
  port: Number(process.env.EMAIL_SMTP_PORT),
  secure: Number(process.env.EMAIL_SMTP_PORT) === 465,
  auth: { user: process.env.EMAIL_SMTP_USER, pass: process.env.EMAIL_SMTP_PASS },
  connectionTimeout: 8000,
  greetingTimeout: 8000,
  socketTimeout: 10000,
})

console.log('Host:', process.env.EMAIL_SMTP_HOST, '| Porta:', process.env.EMAIL_SMTP_PORT, '| De:', process.env.EMAIL_REMETENTE)

try {
  await transporter.verify()
  console.log('VERIFICACAO: OK (conectou e autenticou)')
} catch (e) {
  console.log('VERIFICACAO FALHOU:', e.responseCode ?? e.code ?? '?', '|', String(e.message).slice(0, 400))
  if (e.response) console.log('Resposta do servidor:', String(e.response).slice(0, 400))
  process.exit(1)
}

try {
  const info = await transporter.sendMail({
    from: process.env.EMAIL_REMETENTE,
    to: process.env.EMAIL_SMTP_USER,
    subject: 'Teste — SMTP da Lume configurado',
    text: 'Se voce recebeu este e-mail, o SMTP esta funcionando. Os codigos de confirmacao de conta vao sair por aqui.',
    html: '<p>Se você recebeu este e-mail, o <b>SMTP da Lume está funcionando</b>.</p><p>Os códigos de confirmação de conta vão sair por aqui. 😊</p>',
  })
  console.log('ENVIO: OK — messageId:', info.messageId)
} catch (e) {
  console.log('ENVIO FALHOU:', e.responseCode ?? e.code ?? '?', '|', String(e.message).slice(0, 400))
  if (e.response) console.log('Resposta do servidor:', String(e.response).slice(0, 400))
  process.exit(2)
}
