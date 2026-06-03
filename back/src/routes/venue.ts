import { Router } from 'express'
import { z } from 'zod'
import prisma from '../lib/prisma'
import { authenticateToken } from '../middleware/authMiddleware'

const router = Router()

const venueSchema = z.object({
  name: z.string().min(1),
  city: z.string().min(1),
  address1: z.string().optional(),
  address2: z.string().optional(),
  zipCode: z.string().optional(),
})

router.get('/', async (_req, res) => {
  const venues = await prisma.venue.findMany()
  res.json(venues)
})

router.post('/', authenticateToken, async (req, res) => {
  try {
    const data = venueSchema.parse(req.body)
    const venue = await prisma.venue.create({ data })
    res.status(201).json(venue)
  } catch {
    res.status(400).json({ error: 'Données invalides' })
  }
})

export default router
