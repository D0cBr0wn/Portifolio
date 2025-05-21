import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { loginLimiter } from '../middleware/rateLimiterMiddleware'
import { authenticateToken } from '../middleware/authMiddleware'
import { banIp } from '../middleware/loginAttemptMiddleware'
import { sendAdminBanAlert } from '../utils/sendAlerts'
import { handleFailedLogin } from '../middleware/loginAttemptMiddleware'
const router = Router()

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

const SECRET = process.env.JWT_SECRET ?? 'fallback_secret'

router.post(
  '/register',
  //authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { email, password } = authSchema.parse(req.body)
      const hash = await bcrypt.hash(password, 10)
      const user = await prisma.user.create({ data: { email, password: hash } })
      res.status(201).json({ id: user.id, email: user.email })
      return
    } catch (err) {
      res.status(400).json({ error: 'Invalid input' })
      return
    }
  }
)

router.post(
  '/login',
  loginLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = authSchema.parse(req.body)
      const ip = req.ip || req.connection.remoteAddress || ''
      // user unknown or bad password
      const user = await prisma.user.findUnique({ where: { email } })

      if (email.toLowerCase().includes('admin')) {
        await banIp(ip, 'Attempted login with forbidden email')
        await sendAdminBanAlert(
          ip,
          email,
          'Tentative de login avec email "admin"'
        )
        res.status(403).json({ error: 'Access denied' })
        return
      }

      if (!user || !(await bcrypt.compare(password, user.password))) {
        await handleFailedLogin(ip, email)
        res.status(401).json({ error: 'Access denied' })
        return
      }

      if (user.banUntil && user.banUntil > new Date()) {
        res.status(403).json({ error: 'Access denied' })
        return
      }

      // user banned for security reason
      if (user.banUntil && user.banUntil > new Date()) {
        res.status(403).json({ error: 'Access denied' })
        return
      }

      // MFA activé ?
      if (user.mfaSecret) {
        // MFA requis, on ne renvoie pas de token JWT complet
        res.status(206).json({
          mfaRequired: true,
          userId: user.id,
          message: 'MFA required'
        })
        return
      }

      // Pas de MFA, on génère le token JWT normal

      const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: '2h' })
      res.json({ token })
    } catch (err) {
      res.status(400).json({ error: 'Invalid input' })
      return
    }
  }
)

export default router
