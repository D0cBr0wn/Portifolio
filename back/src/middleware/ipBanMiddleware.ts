import { Request, Response, NextFunction } from 'express'
import prisma from '../lib/prisma'

export async function ipBanCheck(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const ip = req.ip || req.connection.remoteAddress || ''
  const now = new Date()

  // Purge bans expirés à chaque requête (optionnel, peut être mis en tâche CRON)
  await prisma.ipBan.deleteMany({ where: { expiresAt: { lt: now } } })

  const ban = await prisma.ipBan.findUnique({ where: { ip } })

  if (ban && ban.expiresAt > now) {
    res.status(403).json({
      error: `Access denied`
    })
    return
  }

  next()
}
