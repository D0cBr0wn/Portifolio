export interface JwtUserPayload {
  userId: number
  email: string
  role: 'USER' | 'ADMIN'
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload
    }
  }
}
