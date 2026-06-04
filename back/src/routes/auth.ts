import { Router } from 'express'
import type { Request, Response } from 'express'
import prisma from '../lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { loginLimiter } from '../middleware/rateLimiterMiddleware'
import { handleFailedLogin, banIp } from '../middleware/loginAttemptMiddleware'
import { sendAdminBanAlert } from '../utils/sendAlerts'

const router = Router()

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})


router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password } = authSchema.parse(req.body)
    const hash = await bcrypt.hash(password, 12)
    const count = await prisma.user.count()
    const role = count === 0 ? 'ADMIN' : 'USER'
    const user = await prisma.user.create({ data: { email, password: hash, role } })
    res.status(201).json({ id: user.id, email: user.email })
  } catch {
    res.status(400).json({ error: 'Identifiants invalides' })
  }
})

router.post('/login', loginLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = authSchema.parse(req.body)
    const ip = req.ip ?? req.socket.remoteAddress ?? ''

    if (email.toLowerCase().includes('admin')) {
      await banIp(ip, 'Tentative avec email "admin"')
      await sendAdminBanAlert(ip, email, 'Tentative de login avec email "admin"')
      res.status(403).json({ error: 'Identifiants invalides' })
      return
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user || !(await bcrypt.compare(password, user.password))) {
      await handleFailedLogin(ip, email)
      res.status(401).json({ error: 'Identifiants invalides' })
      return
    }

    if (user.banUntil && user.banUntil > new Date()) {
      res.status(403).json({ error: 'Identifiants invalides' })
      return
    }

    if (user.mfaSecret) {
      res.status(206).json({ mfaRequired: true, userId: user.id, message: 'MFA required' })
      return
    }

    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '1h' })
    res.json({ token })
  } catch {
    res.status(400).json({ error: 'Identifiants invalides' })
  }
})

export default router
