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
  // Conexão: TLS para banco gerenciado + timeouts para não segurar worker.
  DB_SSL: bool({ default: false }),
  DB_SSL_REJECT_UNAUTHORIZED: bool({ default: true }),
  DB_POOL_MAX: num({ default: 10 }),
  DB_CONN_TIMEOUT_MS: num({ default: 10_000 }),
  DB_IDLE_TIMEOUT_MS: num({ default: 30_000 }),
  DB_STATEMENT_TIMEOUT_MS: num({ default: 30_000 }),
  PORT: port({ default: 4000 }),
  CLIENTE_ORIGEM: str({ default: 'http://localhost:5173' }),
  BACKEND_URL: str({ default: 'http://localhost:4000' }),
  JWT_SECRET: str({ devDefault: 'segredo-dev-inseguro-apenas-para-desenvolvimento' }),
  MP_ACCESS_TOKEN: str({ default: '' }),
  // Segredo do painel do Mercado Pago para validar a assinatura dos webhooks.
  MP_WEBHOOK_SECRET: str({ default: '' }),
  // MELHOR ENVIO (cotação de frete). Sem ME_TOKEN o cálculo fica desativado
  // e o site segue exatamente como hoje (sem frete), igual ao MP vazio.
  ME_TOKEN: str({ default: '' }),
  // sandbox | production (produção = https://melhorenvio.com.br)
  ME_AMBIENTE: str({ default: 'sandbox' }),
  // CEP da loja (remetente) — obrigatório junto com o token para cotar.
  ME_CEP_ORIGEM: str({ default: '' }),
  // Transportadoras a cotar (ex.: "1,2,18"). Vazio = todas as disponíveis.
  ME_SERVICOS: str({ default: '' }),
  // Contato do app no header User-Agent (exigência da API do Melhor Envio).
  ME_CONTATO: str({ default: '' }),
  // Ative quando houver um proxy reverso na frente (nginx/Railway/Render)
  // para o rate limit enxergar o IP real do cliente.
  TRUST_PROXY: bool({ default: false }),
  // Minutos que um pedido 'pendente' (esperando Mercado Pago) pode ficar sem
  // pagar antes do job liberar a peça reservada. 0 desliga a expiração.
  PEDIDO_EXPIRA_MINUTOS: num({ default: 30 }),
  // E-mail transacional via SMTP (verificação de conta).
  // Sem EMAIL_SMTP_PASS o envio é simulado (código só logado no console).
  EMAIL_SMTP_HOST: str({ default: 'smtp.gmail.com' }),
  EMAIL_SMTP_PORT: port({ default: 465 }),
  EMAIL_SMTP_USER: str({ default: '' }),
  EMAIL_SMTP_PASS: str({ default: '' }),
  EMAIL_REMETENTE: str({ default: 'Lume <nao-responda@lume.com>' }),
  // Opcional: caminho (.relativo ao backend/ ou absoluto) de um PEM com CA
  // extra confiável localmente (ex.: antivírus que intercepta TLS).
  // Em produção normalmente fica vazio — validação de certificado continua ativa.
  EMAIL_SMTP_EXTRA_CA: str({ default: '' }),
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
  // Com o gateway ligado, o webhook é a única coisa que confirma pagamento.
  // Sem segredo, a assinatura não pode ser validada — o servidor não sobe.
  if (env.MP_ACCESS_TOKEN && !env.MP_WEBHOOK_SECRET) {
    problemas.push(
      'MP_WEBHOOK_SECRET ausente com MP_ACCESS_TOKEN preenchido — gere o segredo no painel ' +
        'do Mercado Pago (Suas integrações > Webhooks > Configurar notificação > revelar chave)'
    )
  }
  if (env.MP_ACCESS_TOKEN && /localhost|127\.0\.0\.1/i.test(env.BACKEND_URL)) {
    problemas.push(
      'BACKEND_URL apontando para localhost com pagamento ativo — o Mercado Pago não alcança ' +
        'esse webhook; use a URL pública (https://seu-dominio.com)'
    )
  }
  // Frete ligado sem origem: toda cotação falharia em produção.
  if (env.ME_TOKEN && !env.ME_CEP_ORIGEM) {
    problemas.push('ME_CEP_ORIGEM ausente com ME_TOKEN preenchido — informe o CEP da loja (só dígitos)')
  }
  if (env.ME_AMBIENTE !== 'sandbox' && env.ME_AMBIENTE !== 'production') {
    problemas.push('ME_AMBIENTE inválido — use "sandbox" ou "production"')
  }

  if (problemas.length > 0) {
    console.error('\n❌ O servidor RECUSOU iniciar: configuração de produção inválida.')
    for (const problema of problemas) console.error(`   • ${problema}`)
    console.error('')
    process.exit(1)
  }

  // Avisos: o servidor sobe, mas o comportamento fica limitado.
  if (!env.EMAIL_SMTP_USER || !env.EMAIL_SMTP_PASS) {
    console.warn(
      '⚠️  SMTP não configurado: e-mails de verificação ficam SIMULADOS e o código NÃO é ' +
        'logado em produção. Sem SMTP ninguém consegue verificar conta nem recuperar senha.'
    )
  }
  if (!env.MP_ACCESS_TOKEN) {
    console.warn('⚠️  MP_ACCESS_TOKEN vazio: pagamento segue SIMULADO (nenhum valor é cobrado).')
  }
  if (!env.ME_TOKEN) {
    console.warn('⚠️  ME_TOKEN vazio: cálculo de frete DESATIVADO (o carrinho não oferece frete).')
  }
  if (!env.TRUST_PROXY) {
    console.warn('⚠️  TRUST_PROXY=false: atrás de nginx/Railway/Render o rate limit não enxerga o IP real.')
  }
}

export default env
