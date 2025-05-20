import rateLimit from 'express-rate-limit'

// Limite à 5 requêtes toutes les 15 minutes par IP
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  message:
    'Too many login attempts from this IP, please try again after 15 minutes',
  standardHeaders: true, // Retourne les infos rate limit dans les headers `RateLimit-*`
  legacyHeaders: false
})
