import type { Request, Response, NextFunction } from 'express'

export function requireSelfOrAdmin(req: Request, res: Response, next: NextFunction): void {
  const paramId = parseInt(String(req.params.id), 10)

  if (isNaN(paramId)) {
    res.status(400).json({ error: 'ID invalide' })
    return
  }

  const user = req.user
  if (!user) {
    res.status(403).json({ error: 'Non autorisé' })
    return
  }

  if (user.role === 'ADMIN' || user.userId === paramId) {
    next()
    return
  }

  res.status(403).json({ error: 'Accès interdit' })
}
