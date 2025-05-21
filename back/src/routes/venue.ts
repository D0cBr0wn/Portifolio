import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'
import { z } from 'zod'
import { authenticateToken } from '../middleware/authMiddleware'
import { ParamsDictionary } from 'express-serve-static-core'

const router = Router()

const venueSchema = z.object({
  name: z.string().min(1),
  address1: z.string(),
  address2: z.string(),
  zipCode: z.string(),
  city: z.string().min(1)
})

// GET all venues
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  const venues = await prisma.venue.findMany()
  res.json(venues)
})

// POST a new venue
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const data = venueSchema.parse(req.body)
    const venue = await prisma.venue.create({ data })
    res.status(201).json(venue)
    return
  } catch (err) {
    res.status(400).json({ error: err })
    return
  }
})

// PUT update a venue by ID
router.put(
  '/:id',
  authenticateToken,
  async (req: Request<ParamsDictionary>, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid ID' })
      return
    }

    try {
      const data = venueSchema.parse(req.body)
      const updatedVenue = await prisma.venue.update({
        where: { id },
        data
      })
      res.json(updatedVenue)
    } catch (err) {
      res.status(400).json({ error: err })
      return
    }
  }
)

// DELETE a venue by ID
router.delete(
  '/:id',
  authenticateToken,
  async (req: Request<ParamsDictionary>, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) res.status(400).json({ error: 'Invalid ID' })

    try {
      await prisma.venue.delete({
        where: { id }
      })
      res.status(204).send() // No content
      return
    } catch (err) {
      res.status(400).json({ error: err })
      return
    }
  }
)

export default router
