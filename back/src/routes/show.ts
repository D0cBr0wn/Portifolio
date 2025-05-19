import { Router, Request, Response } from 'express'
import { PrismaClient } from '../../generated/prisma_client'
import { z } from 'zod'

const router = Router()
const prisma = new PrismaClient()

// Définir le type de paramètre `id`
interface ShowParams {
  id: string
}

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
router.post('/', async (req: Request, res: Response) => {
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

// PUT update a show by ID
router.put(
  '/:id',
  async (req: Request<ShowParams>, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) res.status(400).json({ error: 'Invalid ID' })

    try {
      const data = showSchema.parse(req.body)
      const updatedShow = await prisma.show.update({
        where: { id },
        data
      })
      res.json(updatedShow)
    } catch (err) {
      res.status(400).json({ error: err })
    }
  }
)

// DELETE a show by ID
router.delete(
  '/:id',
  async (req: Request<ShowParams>, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) res.status(400).json({ error: 'Invalid ID' })

    try {
      await prisma.show.delete({
        where: { id }
      })
      res.status(204).send() // No content
    } catch (err) {
      res.status(400).json({ error: err })
    }
  }
)

export default router
