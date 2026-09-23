import { cleanEnv, str, port, num, bool } from 'envalid'
import dotenv from 'dotenv'

dotenv.config()

const env = cleanEnv(process.env, {
  NODE_ENV: str({ default: 'development' }),
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

// ---------------------------------------------------------------------------
// Travas de produção: o servidor RECUSA iniciar se estiver com config de
// desenvolvimento. Em development/test essas regras não valem.
// ---------------------------------------------------------------------------
if (env.NODE_ENV === 'production') {
  const problemas = []

  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32 || /^troque/i.test(env.JWT_SECRET)) {
    problemas.push(
      'JWT_SECRET ausente/fraco (mínimo 32 caracteres aleatórios). Gere um com: ' +
        'node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))"'
    )
  }
  if (/localhost|127\.0\.0\.1/i.test(env.CLIENTE_ORIGEM)) {
    problemas.push('CLIENTE_ORIGEM apontando para localhost — use o domínio público (ex.: https://seu-dominio.com)')
  }
  if (!env.DB_PASSWORD || env.DB_PASSWORD === 'postgres') {
    problemas.push('DB_PASSWORD vazia ou padrão ("postgres") — use a senha forte do provedor do banco')
  }

  if (problemas.length > 0) {
    console.error('\n❌ O servidor RECUSOU iniciar: configuração de produção inválida.')
    for (const problema of problemas) console.error(`   • ${problema}`)
    console.error('')
    process.exit(1)
  }

  // Avisos: o servidor sobe, mas o comportamento fica limitado.
  if (!env.EMAIL_SMTP_USER || !env.EMAIL_SMTP_PASS) {
    console.warn('⚠️  SMTP não configurado: e-mails de verificação ficam SIMULADOS (código só no log).')
  }
  if (!env.MP_ACCESS_TOKEN) {
    console.warn('⚠️  MP_ACCESS_TOKEN vazio: pagamento segue SIMULADO (nenhum valor é cobrado).')
  }
  if (!env.TRUST_PROXY) {
    console.warn('⚠️  TRUST_PROXY=false: atrás de nginx/Railway/Render o rate limit não enxerga o IP real.')
  }
}

export default env
