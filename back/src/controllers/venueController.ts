import { Request, Response } from 'express'
import prisma from '../lib/prisma'
import { z } from 'zod'

const venueSchema = z.object({
  name: z.string().min(1),
  address1: z.string(),
  address2: z.string(),
  zipCode: z.string(),
  city: z.string().min(1)
})

export const getAllVenues = async (req: Request, res: Response) => {
  const venues = await prisma.venue.findMany()
  res.json(venues)
  return
}

export const createVenue = async (req: Request, res: Response) => {
  try {
    const data = venueSchema.parse(req.body)
    const venue = await prisma.venue.create({ data })
    res.status(201).json(venue)
    return
  } catch (err) {
    res.status(400).json({ error: err })
    return
  }
}

export const updateVenue = async (req: Request, res: Response) => {
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
    return
  } catch (err) {
    res.status(400).json({ error: err })
    return
  }
}

export const deleteVenue = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid ID' })
    return
  }

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
