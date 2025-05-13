import { Router } from 'express'
import { PrismaClient } from '../../generated/prisma_client'
import { z } from 'zod'

const router = Router()
const prisma = new PrismaClient()

const venueSchema = z.object({
  name: z.string().min(1),
  city: z.string().min(1)
})

// GET all venues
router.get('/', async (req, res) => {
  const venues = await prisma.venue.findMany()
  res.json(venues)
})

// POST a new venue
router.post('/', async (req, res) => {
  try {
    const data = venueSchema.parse(req.body)
    const venue = await prisma.venue.create({ data })
    res.status(201).json(venue)
  } catch (err) {
    res.status(400).json({ error: err })
  }
})

export default router
