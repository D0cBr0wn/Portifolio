import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'
import { z } from 'zod'
import { authenticateToken } from '../middleware/authMiddleware'
import { ParamsDictionary } from 'express-serve-static-core'

const router = Router()

const showSchema = z.object({
  label: z.string().min(1),
  date: z
    .string()
    .refine(d => !isNaN(Date.parse(d)), { message: 'Invalid date' }),
  venueId: z.number()
})

// GET all shows
router.get('/', async (req: Request, res: Response) => {
  const shows = await prisma.show.findMany({ include: { venue: true } })
  res.json(shows)
})

// POST a new show
router.post('/', authenticateToken, async (req: Request, res: Response) => {
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
    return
  } catch (err) {
    res.status(400).json({ error: err })
    return
  }
})

// PUT update a show by ID
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
      const data = showSchema.parse(req.body)
      const updatedShow = await prisma.show.update({
        where: { id },
        data
      })
      res.json(updatedShow)
    } catch (err) {
      res.status(400).json({ error: err })
      return
    }
  }
)

// DELETE a show by ID
router.delete(
  '/:id',
  authenticateToken,
  async (req: Request<ParamsDictionary>, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid ID' })
      return
    }

    try {
      await prisma.show.delete({
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
