import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '../../generated/prisma_client'

const prisma = new PrismaClient()

export async function ipBanCheck(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const ip = req.ip || req.connection.remoteAddress || ''
  const now = new Date()

  // Purge bans expirés à chaque requête (optionnel, peut être mis en tâche CRON)
  await prisma.ipBan.deleteMany({ where: { expiresAt: { lt: now } } })

  const ban = await prisma.ipBan.findUnique({ where: { ip } })

  // TODO REMOVE TOO MUCH INFOS
  if (ban && ban.expiresAt > now) {
    return res
      .status(403)
      .json({
        error: `Access denied: banned for reason "${ban.reason}" until ${ban.expiresAt.toISOString()}`
      })
  }

  next()
}
