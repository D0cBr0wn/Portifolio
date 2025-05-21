import request from 'supertest'
import express, { Request, Response, NextFunction } from 'express'
jest.mock('../middleware/authMiddleware', () => ({
  authenticateToken: (req: Request, res: Response, next: NextFunction) => {
    ;(req as any).user = {} // ou ce que tu veux simuler
    next()
  }
}))
import mfaRouter from '../routes/mfa' // adapte le chemin
import prisma from '../lib/prisma'
import speakeasy from 'speakeasy'
import jwt from 'jsonwebtoken'

// Mock prisma
jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn()
    }
  }
}))

// Mock speakeasy
jest.mock('speakeasy', () => ({
  generateSecret: jest.fn(),
  totp: {
    verify: jest.fn()
  }
}))

// Mock jwt.sign pour toujours renvoyer un token fixe
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'jwt-token')
}))

// Middleware authenticateToken mocké pour injecter un user dans req
const mockAuthenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  req.user = { userId: 123, email: 'user@example.com' }
  next()
}

// Remplacer le vrai middleware dans le router par notre mock
jest.mock('../middleware/authMiddleware', () => ({
  authenticateToken: (req: Request, res: Response, next: NextFunction) => {
    req.user = { userId: 123, email: 'user@example.com' }
    next()
  }
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
          'otpauth://totp/MonApp%20(user@example.com)?secret=FAKEBASE32SECRET'
      }
      ;(speakeasy.generateSecret as jest.Mock).mockReturnValue(fakeSecret)
      ;(prisma.user.update as jest.Mock).mockResolvedValue({})

      const res = await request(app)
        .post('/mfa/setup')
        .set('Authorization', 'Bearer faketoken') // token accepté par le mock
        .send()

      expect(speakeasy.generateSecret).toHaveBeenCalledWith({
        name: 'MonApp (user@example.com)'
      })
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 123 },
        data: { mfaSecret: fakeSecret.base32 }
      })

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('qrCodeDataURL')
      expect(res.body).toHaveProperty('secret', fakeSecret.base32)
    })
  })

  describe('POST /mfa/verify', () => {
    // it('should return 401 if no userId in req.user', async () => {
    //   // On va monter une route spéciale pour tester ce cas:
    //   const testApp = express()
    //   testApp.use(express.json())
    //   testApp.post('/mfa/verify', (req, res, next) => next(), mfaRouter)

    //   const res = await request(testApp)
    //     .post('/mfa/verify')
    //     .send({ token: '123456' })
    //   expect(res.status).toBe(401)
    //   expect(res.body.error).toBe('Unauthorized')
    // })

    it('should return 400 if no user or no mfaSecret', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const res = await request(app)
        .post('/mfa/verify')
        .set('Authorization', 'Bearer faketoken')
        .send({ token: '123456' })

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('MFA not setup')
    })

    it('should return 400 if TOTP invalid', async () => {
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

      expect(speakeasy.totp.verify).toHaveBeenCalledWith({
        secret: 'FAKEBASE32SECRET',
        encoding: 'base32',
        token: '000000',
        window: 1
      })
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Invalid token')
    })

    it('should return verified true and JWT token if TOTP valid', async () => {
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
