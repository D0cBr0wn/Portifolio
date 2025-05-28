import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'
import { authenticateToken } from '../middleware/authMiddleware'
import jwt, { JwtPayload } from 'jsonwebtoken'
import speakeasy from 'speakeasy'
import qrcode from 'qrcode'

const router = Router()
const SECRET = process.env.JWT_SECRET ?? 'fallback_secret'

router.post(
  '/setup',
  //authenticateToken,
  async (req, res) => {
    try {
      // const userId = req.user?.userId // récupéré via authenticateToken middleware
      const authHeader = req.headers.authorization

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res
          .status(401)
          .json({ error: 'Missing or invalid Authorization header' })
        return
      }

      const token = authHeader.split(' ')[1]

      let decoded
      try {
        decoded = jwt.verify(token, SECRET)
      } catch (err) {
        res.status(401).json({ error: 'Invalid or expired token' })
        return
      }

      const payload = decoded as JwtPayload
      const userId = payload.userId
      const email = payload.email ?? 'unknown'

      if (
        typeof decoded !== 'object' ||
        decoded === null ||
        decoded.type !== 'mfa_setup'
      ) {
        res.status(403).json({ error: 'Invalid token type for MFA setup' })
        return
      }

      // Générer un secret TOTP
      const secret = speakeasy.generateSecret({
        name: `OdysseyOfOne (${email})` // nom affiché dans Google Authenticator
      })

      // Générer un QR code data URL à partir du secret
      const qrCodeDataURL = await qrcode.toDataURL(secret.otpauth_url!)

      // Stocker temporairement ce secret dans ta base ou en session
      await prisma.user.update({
        where: { id: userId },
        data: { mfaSecret: secret.base32 }
      })

      res.json({ qrCodeDataURL, secret: secret.base32 })
      return
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

router.post(
  '/verify',
  authenticateToken,
  async (req: Request, res: Response) => {
    const userId = req.user?.userId
    const { token } = req.body // code TOTP Google Authenticator

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || !user.mfaSecret) {
      res.status(400).json({ error: 'MFA not setup' })
      return
    }

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 1
    })

    if (verified) {
      // Génère un JWT complet ici
      const finalToken = jwt.sign(
        { userId: user.id, email: user.email },
        SECRET,
        {
          expiresIn: '2h'
        }
      )
      res.json({ verified: true, token: finalToken })
    } else {
      res.status(400).json({ error: 'Invalid token' })
      return
    }
  }
)

export default router
