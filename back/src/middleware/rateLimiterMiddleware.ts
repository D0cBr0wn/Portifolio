import rateLimit from 'express-rate-limit'

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { error: 'Identifiants invalides' },
  standardHeaders: true,
  legacyHeaders: false,
})
