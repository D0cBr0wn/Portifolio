import { Router } from 'express'
import { PrismaClient } from '../../generated/prisma_client'
import { z } from 'zod'

const router = Router()
const prisma = new PrismaClient()

const showSchema = z.object({
  label: z.string().min(1),
  date: z
    .string()
    .refine(d => !isNaN(Date.parse(d)), { message: 'Invalid date' }),
  venueId: z.number()
})

// GET all shows
router.get('/', async (req, res) => {
  const shows = await prisma.show.findMany({ include: { venue: true } })
  res.json(shows)
})

// POST a new show
router.post('/', async (req, res) => {
  try {
    const data = showSchema.parse(req.body)
    const show = await prisma.show.create({
      data: {
        label: data.label,
        date: new Date(data.date),
        venueId: data.venueId
      }
    })
    res.status(201).json(show)
  } catch (err) {
    res.status(400).json({ error: err })
  }
})

export default router
