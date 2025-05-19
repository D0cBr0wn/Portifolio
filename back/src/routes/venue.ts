import { Router, Request, Response } from 'express'
import { PrismaClient } from '../../generated/prisma_client'
import { z } from 'zod'

const router = Router()
const prisma = new PrismaClient()

const venueSchema = z.object({
  name: z.string().min(1),
  address1: z.string(),
  address2: z.string(),
  zipCode: z.string(),
  city: z.string().min(1)
})

// Définir le type de paramètre `id`
interface VenueParams {
  id: string
}

// GET all venues
router.get('/', async (req: Request, res: Response) => {
  const venues = await prisma.venue.findMany()
  res.json(venues)
})

// POST a new venue
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = venueSchema.parse(req.body)
    const venue = await prisma.venue.create({ data })
    res.status(201).json(venue)
  } catch (err) {
    res.status(400).json({ error: err })
  }
})

// PUT update a venue by ID
router.put(
  '/:id',
  async (req: Request<VenueParams>, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) res.status(400).json({ error: 'Invalid ID' })

    try {
      const data = venueSchema.parse(req.body)
      const updatedVenue = await prisma.venue.update({
        where: { id },
        data
      })
      res.json(updatedVenue)
    } catch (err) {
      res.status(400).json({ error: err })
    }
  }
)

// DELETE a venue by ID
router.delete(
  '/:id',
  async (req: Request<VenueParams>, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) res.status(400).json({ error: 'Invalid ID' })

    try {
      await prisma.venue.delete({
        where: { id }
      })
      res.status(204).send() // No content
    } catch (err) {
      res.status(400).json({ error: err })
    }
  }
)

export default router
