export interface JwtUserPayload {
  userId: number
  email: string
  role: 'USER' | 'ADMIN'
  scope?: 'mfa-setup'
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload
    }
  }
}
