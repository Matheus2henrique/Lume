import pino from 'pino'

// LGPD: e-mail, senha, código de verificação e token nunca entram no log.
// O redact do pino corta na serialização, antes de chegar ao transporte —
// vale para qualquer logger.{info,warn,error} que passe estes campos.
const CAMINHOS_SENSIVEIS = [
  'email',
  '*.email',
  'senha',
  '*.senha',
  'senha_hash',
  '*.senha_hash',
  'codigo',
  '*.codigo',
  'token',
  '*.token',
  'password',
  '*.password',
  'req.headers.authorization',
  'req.headers.cookie',
  'headers.authorization',
  'headers.cookie',
  'res.headers["set-cookie"]',
]

/**
 * Opções do logger, separadas do `pino()` para poderem ser testadas:
 * o teste monta uma instância sobre um stream de memória e confere que
 * nada sensível chega ao log.
 */
export function opcoesLogger() {
  return {
    level: process.env.LOG_LEVEL || 'info',
    redact: { paths: CAMINHOS_SENSIVEIS, censor: '[REDACTED]' },
    ...(process.env.NODE_ENV !== 'production' && {
      transport: {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'HH:MM:ss' },
      },
    }),
    formatters: {
      level(label) {
        return { level: label }
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  }
}

const logger = pino(opcoesLogger())

/**
 * Versão segura de um e-mail para log: `maria@exemplo.com` → `m***@e***`.
 * Log serve para depurar, não para guardar dado pessoal (LGPD).
 */
export function mascaraEmail(email) {
  const texto = String(email || '').trim().toLowerCase()
  const arroba = texto.indexOf('@')
  if (arroba <= 0 || arroba === texto.length - 1) return '[e-mail]'
  return `${texto[0]}***@${texto[arroba + 1]}***`
}

export default logger
