import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { JwtUserPayload } from '../types/express'

const SECRET = process.env.JWT_SECRET ?? 'fallback_secret'

export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    res.status(401).json({ error: 'No token provided' })
    return
  }

  try {
    const payload = jwt.verify(token, SECRET) as JwtUserPayload
    ;(req as any).user = payload
    next()
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token' })
    return
  }
}
