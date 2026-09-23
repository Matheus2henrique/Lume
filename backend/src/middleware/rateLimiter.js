import rateLimit from 'express-rate-limit'

export const limiterGlobal = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitas requisições. Tente novamente em 1 minuto.' },
})

export const limiterAuth = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitas tentativas. Aguarde 1 minuto.' },
})

export const limiterPagamento = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitas requisições de pagamento. Tente novamente em 1 minuto.' },
})

export const limiterReenvio = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitos reenvios. Aguarde 1 minuto.' },
})
