import { Router, Request, Response } from 'express'
import { PrismaClient } from '../../generated/prisma_client'
import { z } from 'zod'
import { authenticateToken } from '../middleware/authMiddleware'

const router = Router()
const prisma = new PrismaClient()

// GET all ban ips
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  const shows = await prisma.ipBan.findMany()
  res.json(shows)
})

export default router
