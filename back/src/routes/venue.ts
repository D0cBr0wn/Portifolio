import { Router } from 'express'
import type { Request, Response } from 'express'
import prisma from '../lib/prisma'
import { authenticateToken } from '../middleware/authMiddleware'
import { requireAdmin } from '../middleware/requireAdmin'
import { venueSchema } from '../schemas/venue.schema'

const router = Router()

router.get('/', async (_req, res) => {
  const venues = await prisma.venue.findMany()
  res.json(venues)
})

router.post('/', authenticateToken, async (req, res) => {
  try {
    const data = venueSchema.parse(req.body)
    const venue = await prisma.venue.create({ data: { ...data, createdById: req.user!.userId } })
    res.status(201).json(venue)
  } catch {
    res.status(400).json({ error: 'Données invalides' })
  }
})

router.put('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id), 10)
  if (isNaN(id)) {
    res.status(400).json({ error: 'ID invalide' })
    return
  }
  try {
    const data = venueSchema.partial().parse(req.body)
    const venue = await prisma.venue.update({ where: { id }, data })
    res.json(venue)
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'P2025') {
      res.status(404).json({ error: 'Lieu introuvable' })
      return
    }
    res.status(400).json({ error: 'Données invalides' })
  }
})

router.delete('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id), 10)
  if (isNaN(id)) {
    res.status(400).json({ error: 'ID invalide' })
    return
  }
  try {
    await prisma.venue.delete({ where: { id } })
    res.status(204).send()
  } catch (e: unknown) {
    const code = (e as { code?: string }).code
    if (code === 'P2003') {
      res.status(409).json({ error: 'Ce lieu est associé à des concerts et ne peut pas être supprimé.' })
      return
    }
    if (code === 'P2025') {
      res.status(404).json({ error: 'Lieu introuvable' })
      return
    }
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
