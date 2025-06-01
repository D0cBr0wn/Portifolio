import type { User } from '../../generated/prisma_client'
import jwt from 'jsonwebtoken'

export const createMfaTempToken = (user: User): string => {
  const SECRET = process.env.JWT_SECRET ?? 'fallback_secret'
  return jwt.sign(
    { userId: user.id, email: user.email, type: 'mfa_temp' },
    SECRET,
    { expiresIn: '2m' }
  )
}
