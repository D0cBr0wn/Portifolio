export interface JwtUserPayload {
  userId: number
  email: string
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload
    }
  }
}
