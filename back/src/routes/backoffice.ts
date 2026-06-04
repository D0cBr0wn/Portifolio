import { Router } from 'express'
import prisma from '../lib/prisma'
import { authenticateToken } from '../middleware/authMiddleware'
import { requireAdmin } from '../middleware/requireAdmin'

const router = Router()

router.get('/shows', authenticateToken, requireAdmin, async (_req, res) => {
  const shows = await prisma.show.findMany({
    include: {
      venue: true,
      createdBy: { select: { email: true } },
    },
  })
  res.json(shows)
})

router.get('/venues', authenticateToken, requireAdmin, async (_req, res) => {
  const venues = await prisma.venue.findMany({
    include: {
      createdBy: { select: { email: true } },
    },
  })
  res.json(venues)
})

export default router
