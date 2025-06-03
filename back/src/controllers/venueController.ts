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
    // No trust F-E
    const venue = await prisma.venue.create({ data })
    console.error(venue)
    res.status(201).json(venue)
    return
  } catch (error) {
    res.status(400).json({ error })
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
    // No trust F-E
    const updatedVenue = await prisma.venue.update({
      where: { id },
      data
    })
    res.json(updatedVenue)
    return
  } catch (error) {
    res.status(400).json({ error })
    return
  }
}

export const deleteVenue = async (req: Request, res: Response) => {
  // seems to be same in update and also in showController => maybe an helper or middleware can be smart to handle this
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid ID' })
    return
  }

  // here again same in showController 
  // maybe use a func with type as key
  // => await prisma[type].delete({where: id})
  try {
    await prisma.venue.delete({
      where: { id }
    })
    res.status(204).send() // No content
    return
  } catch (error) {
    res.status(400).json({ error })
    return
  }
}
