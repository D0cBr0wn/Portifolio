import type { Request, Response, NextFunction } from 'express'
import prisma from '../lib/prisma'

export async function ipBanCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
  const ip = req.ip ?? req.socket.remoteAddress ?? ''
  const now = new Date()

  await prisma.ipBan.deleteMany({ where: { expiresAt: { lt: now } } })

  const ban = await prisma.ipBan.findUnique({ where: { ip } })
  if (ban) {
    res.status(403).json({ error: 'Accès refusé' })
    return
  }

  next()
}
