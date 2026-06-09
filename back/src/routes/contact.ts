import { Router } from 'express'
import type { Request, Response } from 'express'
import prisma from '../lib/prisma'
import { authenticateToken } from '../middleware/authMiddleware'
import { requireAdmin } from '../middleware/requireAdmin'
import { contactLimiter } from '../middleware/rateLimiterMiddleware'
import { contactMessageSchema } from '../schemas/contact.schema'

const router = Router()

router.post('/', contactLimiter, async (req: Request, res: Response) => {
  try {
    const data = contactMessageSchema.parse(req.body)
    const message = await prisma.contactMessage.create({ data })
    res.status(201).json(message)
  } catch {
    res.status(400).json({ error: 'Données invalides' })
  }
})

router.get('/', authenticateToken, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
    })
    res.json(messages)
  } catch {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
