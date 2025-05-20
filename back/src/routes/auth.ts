import { Router, Request, Response } from 'express'
import { PrismaClient } from '../../generated/prisma_client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { loginLimiter } from '../middleware/rateLimiterMiddleware'
import { authenticateToken } from '../middleware/authMiddleware'

const router = Router()
const prisma = new PrismaClient()

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

const SECRET = process.env.JWT_SECRET ?? 'fallback_secret'

router.post(
  '/register',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { email, password } = authSchema.parse(req.body)
      const hash = await bcrypt.hash(password, 10)
      const user = await prisma.user.create({ data: { email, password: hash } })
      res.status(201).json({ id: user.id, email: user.email })
    } catch (err) {
      res.status(400).json({ error: 'Invalid input or email already used' })
    }
  }
)

router.post(
  '/login',
  loginLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = authSchema.parse(req.body)
      const user = await prisma.user.findUnique({ where: { email } })
      if (!user || !(await bcrypt.compare(password, user.password))) {
        res.status(401).json({ error: 'Invalid credentials' })
        return
      }

      const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: '2h' })
      res.json({ token })
    } catch (err) {
      res.status(400).json({ error: 'Invalid input' })
    }
  }
)

export default router
