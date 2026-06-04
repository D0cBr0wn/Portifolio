import { Router } from 'express'
import type { Request, Response } from 'express'
import prisma from '../lib/prisma'
import { authenticateToken } from '../middleware/authMiddleware'
import jwt from 'jsonwebtoken'
import speakeasy from 'speakeasy'
import qrcode from 'qrcode'

const router = Router()

router.post('/setup', authenticateToken, async (req: Request, res: Response) => {
  const userId = req.user?.userId

  const secret = speakeasy.generateSecret({
    name: `Portfolio (${req.user?.email})`,
  })

  const qrCodeDataURL = await qrcode.toDataURL(secret.otpauth_url!)

  await prisma.user.update({
    where: { id: userId },
    data: { mfaSecret: secret.base32 },
  })

  res.json({ qrCodeDataURL, secret: secret.base32 })
})

router.post('/login', async (req: Request, res: Response) => {
  const { userId, token } = req.body

  if (!userId || !token) {
    res.status(400).json({ error: 'Données invalides' })
    return
  }

  const user = await prisma.user.findUnique({ where: { id: Number(userId) } })
  if (!user?.mfaSecret) {
    res.status(400).json({ error: 'MFA non configuré' })
    return
  }

  const verified = speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: 'base32',
    token,
    window: 1,
  })

  if (!verified) {
    res.status(401).json({ error: 'Code invalide' })
    return
  }

  const finalToken = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '1h' })
  res.json({ verified: true, token: finalToken })
})

router.post('/verify', authenticateToken, async (req: Request, res: Response) => {
  const userId = req.user?.userId
  const { token } = req.body

  if (!userId) {
    res.status(401).json({ error: 'Non autorisé' })
    return
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user?.mfaSecret) {
    res.status(400).json({ error: 'MFA non configuré' })
    return
  }

  const verified = speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: 'base32',
    token,
    window: 1,
  })

  if (!verified) {
    res.status(401).json({ error: 'Identifiants invalides' })
    return
  }

  const finalToken = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '1h' })
  res.json({ verified: true, token: finalToken })
})

export default router
