import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { JwtUserPayload } from '../types/express/index.js'

export async function authenticateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization']
  const token = authHeader?.split(' ')[1]

  if (!token) {
    res.status(401).json({ error: 'Non autorisé' })
    return
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtUserPayload
    req.user = payload
    next()
  } catch {
    res.status(403).json({ error: 'Token invalide ou expiré' })
  }
}
