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

router.delete('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id), 10)
  if (isNaN(id)) {
    res.status(400).json({ error: 'ID invalide' })
    return
  }
  try {
    await prisma.contactMessage.delete({ where: { id } })
    res.status(204).send()
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'P2025') {
      res.status(404).json({ error: 'Message introuvable' })
      return
    }
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
