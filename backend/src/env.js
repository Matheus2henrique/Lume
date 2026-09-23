import { cleanEnv, str, port, num, bool } from 'envalid'
import dotenv from 'dotenv'

dotenv.config()

const env = cleanEnv(process.env, {
  DB_HOST: str({ default: 'localhost' }),
  DB_PORT: port({ default: 5432 }),
  DB_USER: str({ default: 'postgres' }),
  DB_PASSWORD: str({ default: 'postgres' }),
  DB_NAME: str({ default: 'lume' }),
  PORT: port({ default: 4000 }),
  CLIENTE_ORIGEM: str({ default: 'http://localhost:5173' }),
  BACKEND_URL: str({ default: 'http://localhost:4000' }),
  JWT_SECRET: str({ devDefault: 'segredo-dev-inseguro-apenas-para-desenvolvimento' }),
  MP_ACCESS_TOKEN: str({ default: '' }),
  // Segredo do painel do Mercado Pago para validar a assinatura dos webhooks.
  MP_WEBHOOK_SECRET: str({ default: '' }),
  // Ative quando houver um proxy reverso na frente (nginx/Railway/Render)
  // para o rate limit enxergar o IP real do cliente.
  TRUST_PROXY: bool({ default: false }),
  // E-mail transacional via SMTP (verificação de conta).
  // Sem EMAIL_SMTP_PASS o envio é simulado (código só logado no console).
  EMAIL_SMTP_HOST: str({ default: 'smtp.gmail.com' }),
  EMAIL_SMTP_PORT: port({ default: 465 }),
  EMAIL_SMTP_USER: str({ default: '' }),
  EMAIL_SMTP_PASS: str({ default: '' }),
  EMAIL_REMETENTE: str({ default: 'Lume <nao-responda@lume.com>' }),
})

export default env
