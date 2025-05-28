import request from 'supertest'
import express, { Request, Response, NextFunction } from 'express'
jest.mock('../middleware/authMiddleware', () => ({
  authenticateToken: (req: Request, res: Response, next: NextFunction) => {
    ;(req as any).user = {}
    next()
  }
}))
import mfaRouter from '../router/mfa'
import prisma from '../lib/prisma'
import speakeasy from 'speakeasy'
import jwt from 'jsonwebtoken'
import qrcode from 'qrcode'

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn()
    }
  }
}))

jest.mock('speakeasy', () => ({
  generateSecret: jest.fn(),
  totp: {
    verify: jest.fn()
  }
}))

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'jwt-token'),
  verify: jest.fn()
}))

jest.mock('qrcode', () => ({
  toDataURL: jest.fn(() => 'data:image/png;base64,fakeqrcode')
}))

describe('MFA routes', () => {
  let app: express.Application

  beforeEach(() => {
    app = express()
    app.use(express.json())
    app.use('/mfa', mfaRouter)
    jest.clearAllMocks()
  })

  describe('POST /mfa/setup', () => {
    it('should generate secret, save to DB and return qrCode and secret', async () => {
      const fakeSecret = {
        base32: 'FAKEBASE32SECRET',
        otpauth_url:
          'otpauth://totp/OdysseyOfOne%20(user@example.com)?secret=FAKEBASE32SECRET'
      }
      ;(speakeasy.generateSecret as jest.Mock).mockReturnValue(fakeSecret)
      ;(prisma.user.update as jest.Mock).mockResolvedValue({})
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: 123,
        email: 'user@example.com',
        type: 'mfa_temp'
      })

      const res = await request(app)
        .post('/mfa/setup')
        .set('Authorization', 'Bearer faketoken')
        .send()

      expect(speakeasy.generateSecret).toHaveBeenCalledWith({
        name: 'OdysseyOfOne (user@example.com)'
      })
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 123 },
        data: { mfaSecret: fakeSecret.base32 }
      })
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty(
        'qrCodeDataURL',
        'data:image/png;base64,fakeqrcode'
      )
      expect(res.body).toHaveProperty('secret', fakeSecret.base32)
    })
  })

  describe('POST /mfa/verify', () => {
    it('should return 401 if token is invalid or expired', async () => {
      ;(jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token')
      })

      const res = await request(app)
        .post('/mfa/verify')
        .set('Authorization', 'Bearer invalidtoken')
        .send({ token: '123456' })

      expect(res.status).toBe(401)
      expect(res.body.error).toBe('Invalid or expired token')
    })

    it('should return 403 if token type is incorrect', async () => {
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: 123,
        type: 'access'
      })

      const res = await request(app)
        .post('/mfa/verify')
        .set('Authorization', 'Bearer invalidtype')
        .send({ token: '123456' })

      expect(res.status).toBe(403)
      expect(res.body.error).toBe('Invalid token type for MFA setup')
    })

    it('should return 400 if no user or mfaSecret', async () => {
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: 123,
        type: 'mfa_temp'
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const res = await request(app)
        .post('/mfa/verify')
        .set('Authorization', 'Bearer faketoken')
        .send({ token: '123456' })

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('MFA not setup')
    })

    it('should return 400 if TOTP is invalid', async () => {
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: 123,
        type: 'mfa_temp'
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 123,
        email: 'user@example.com',
        mfaSecret: 'FAKEBASE32SECRET'
      })
      ;(speakeasy.totp.verify as jest.Mock).mockReturnValue(false)

      const res = await request(app)
        .post('/mfa/verify')
        .set('Authorization', 'Bearer faketoken')
        .send({ token: '000000' })

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Invalid token')
    })

    it('should return verified true and JWT token if TOTP valid', async () => {
      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: 123,
        email: 'user@example.com',
        type: 'mfa_temp'
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 123,
        email: 'user@example.com',
        mfaSecret: 'FAKEBASE32SECRET'
      })
      ;(speakeasy.totp.verify as jest.Mock).mockReturnValue(true)

      const res = await request(app)
        .post('/mfa/verify')
        .set('Authorization', 'Bearer faketoken')
        .send({ token: '123456' })

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 123, email: 'user@example.com' },
        expect.any(String),
        { expiresIn: '2h' }
      )
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ verified: true, token: 'jwt-token' })
    })
  })
})
