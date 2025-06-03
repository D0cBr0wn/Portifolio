import speakeasy from 'speakeasy'
import qrcode from 'qrcode'
import prisma from '../lib/prisma'
import { Request, Response } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET ?? 'fallback_secret'

export const setup = async (req: Request, res: Response) => {
  try {
    const decoded = getDecodedToken(req, res)
    if (!decoded) return
    const payload = decoded as JwtPayload
    const userId = payload.userId
    const email = payload.email ?? 'unknown'

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `OdysseyOfOne (${email})` // nom affiché dans Google Authenticator
    })

    // Generate qrCode from secret
    const qrCodeDataURL = await qrcode.toDataURL(secret.otpauth_url!)

    // Store the secret
    await prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret.base32 }
    })

    // return the secret and qrCode
    res.json({ qrCodeDataURL, secret: secret.base32 })
    return
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const verify = async (req: Request, res: Response) => {
  const decoded = getDecodedToken(req, res)
  if (!decoded) return

  const payload = decoded as jwt.JwtPayload
  const userId = payload.userId

  // if userId is undefined
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const { token } = req.body // code TOTP
  const user = await prisma.user.findUnique({ where: { id: userId } })

  if (!user || !user.mfaSecret) {
    res.status(400).json({ error: 'MFA not setup' })
    return
  }

  // verify MFA code
  const verified = speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: 'base32',
    token,
    window: 1
  })

  if (verified) {
    const finalToken = jwt.sign(
      { userId: user.id, email: user.email },
      SECRET,
      { expiresIn: '2h' }
    )
    res.json({ verified: true, token: finalToken })
  } else {
    res.status(400).json({ error: 'Invalid token' })
  }
}

const getDecodedToken = (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid Authorization header' })
      return
    }

    const tokenJwt = authHeader.split(' ')[1]

    const decoded = jwt.verify(tokenJwt, SECRET)

    if (
      typeof decoded !== 'object' ||
      decoded === null ||
      decoded.type !== 'mfa_temp'
    ) {
      res.status(403).json({ error: 'Invalid token type for MFA setup' })
      return
    }

    return decoded
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' }) 
    return
  }
}
