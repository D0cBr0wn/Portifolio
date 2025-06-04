import { Request, Response } from 'express'
import prisma from '../lib/prisma'
import { z } from 'zod'

const showSchema = z.object({
  label: z.string().min(1),
  date: z
    .string()
    .refine(d => !isNaN(Date.parse(d)), { message: 'Invalid date' }),
  venueId: z.number()
})

export const getAllShows = async (req: Request, res: Response) => {
  try {
    const shows = await prisma.show.findMany({ include: { venue: true } })
    res.json(shows)
    return
  } catch (error) {
    res.status(500).json({ error: error })
    return
  }
}

export const createShow = async (req: Request, res: Response) => {
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
  } catch (error) {
    res.status(400).json({ error: error })
    return
  }
}

export const updateShow = async (req: Request, res: Response) => {
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
    return
  } catch (error) {
    res.status(400).json({ error: error })
    return
  }
}

export const deleteShow = async (req: Request, res: Response) => {
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
  } catch (error) {
    res.status(400).json({ error: error })
    return
  }
}
