import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'
import { z } from 'zod'
import { authenticateToken } from '../middleware/authMiddleware'

const router = Router()

// GET all ban ips
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  const shows = await prisma.ipBan.findMany()
  res.json(shows)
})

export default router
