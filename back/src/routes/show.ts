import { Router } from 'express'
import type { Request, Response } from 'express'
import prisma from '../lib/prisma'
import { authenticateToken } from '../middleware/authMiddleware'
import { showSchema } from '../schemas/show.schema'

const router = Router()

router.get('/', async (_req, res) => {
  const shows = await prisma.show.findMany({ include: { venue: true } })
  res.json(shows)
})

router.post('/', authenticateToken, async (req, res) => {
  try {
    const data = showSchema.parse(req.body)
    const show = await prisma.show.create({
      data: {
        label: data.label,
        details: data.details,
        date: new Date(data.date),
        venueId: data.venueId,
      },
      include: { venue: true },
    })
    res.status(201).json(show)
  } catch {
    res.status(400).json({ error: 'Données invalides' })
  }
})

router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id), 10)
  if (isNaN(id)) {
    res.status(400).json({ error: 'ID invalide' })
    return
  }
  try {
    const data = showSchema.partial().parse(req.body)
    const show = await prisma.show.update({
      where: { id },
      data: {
        ...(data.label !== undefined && { label: data.label }),
        ...(data.details !== undefined && { details: data.details }),
        ...(data.date !== undefined && { date: new Date(data.date) }),
        ...(data.venueId !== undefined && { venueId: data.venueId }),
      },
      include: { venue: true },
    })
    res.json(show)
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'P2025') {
      res.status(404).json({ error: 'Concert introuvable' })
      return
    }
    res.status(400).json({ error: 'Données invalides' })
  }
})

router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id), 10)
  if (isNaN(id)) {
    res.status(400).json({ error: 'ID invalide' })
    return
  }
  try {
    await prisma.show.delete({ where: { id } })
    res.status(204).send()
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'P2025') {
      res.status(404).json({ error: 'Concert introuvable' })
      return
    }
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
