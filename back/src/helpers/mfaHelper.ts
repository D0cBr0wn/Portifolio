import type { User } from '../../generated/prisma_client'
import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET ?? 'fallback_secret'

export const createMfaTempToken = (user: User): string => {
  return jwt.sign(
    { userId: user.id, email: user.email, type: 'mfa_temp' },
    SECRET,
    { expiresIn: '2m' }
  )
}
