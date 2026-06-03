import { Router } from 'express'
import { z } from 'zod'
import prisma from '../lib/prisma'
import { authenticateToken } from '../middleware/authMiddleware'

const router = Router()

const showSchema = z.object({
  label: z.string().min(1),
  date: z.string().refine((d) => !isNaN(Date.parse(d)), { message: 'Date invalide' }),
  venueId: z.number(),
})

router.get('/', async (_req, res) => {
  const shows = await prisma.show.findMany({ include: { venue: true } })
  res.json(shows)
})

router.post('/', authenticateToken, async (req, res) => {
  try {
    const data = showSchema.parse(req.body)
    const show = await prisma.show.create({
      data: { label: data.label, date: new Date(data.date), venueId: data.venueId },
    })
    res.status(201).json(show)
  } catch {
    res.status(400).json({ error: 'Données invalides' })
  }
})

export default router
