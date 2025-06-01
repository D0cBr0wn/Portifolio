import { setup, verify } from '../../controllers/mfaController'
import speakeasy from 'speakeasy'
import qrcode from 'qrcode'
import prisma from '../../lib/prisma'
import jwt from 'jsonwebtoken'

jest.mock('speakeasy')
jest.mock('qrcode')
jest.mock('jsonwebtoken')
jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      update: jest.fn(),
      findUnique: jest.fn()
    }
  }
}))

const mockResponse = () => {
  const res: any = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

describe('MFA Controller', () => {
  afterEach(() => jest.clearAllMocks())

  describe('setup', () => {
    it('should generate a QR code and store MFA secret', async () => {
      const req: any = {
        headers: {
          authorization: 'Bearer fake-jwt'
        }
      }
      const res = mockResponse()

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: 1,
        email: 'user@example.com',
        type: 'mfa_temp'
      })
      ;(speakeasy.generateSecret as jest.Mock).mockReturnValue({
        base32: 'ABCDEF123456',
        otpauth_url: 'otpauth://url'
      })
      ;(qrcode.toDataURL as jest.Mock).mockResolvedValue(
        'data:image/png;base64,...'
      )
      ;(prisma.user.update as jest.Mock).mockResolvedValue({})

      await setup(req, res)

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { mfaSecret: 'ABCDEF123456' }
      })
      expect(res.json).toHaveBeenCalledWith({
        qrCodeDataURL: 'data:image/png;base64,...',
        secret: 'ABCDEF123456'
      })
    })

    it('should return 401 if no token provided', async () => {
      const req: any = { headers: {} }
      const res = mockResponse()

      await setup(req, res)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Missing or invalid Authorization header'
      })
    })
  })

  describe('verify', () => {
    it('should verify MFA code and return final token', async () => {
      const req: any = {
        headers: {
          authorization: 'Bearer valid-jwt'
        },
        body: { token: '123456' }
      }
      const res = mockResponse()

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: 1,
        type: 'mfa_temp'
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'user@example.com',
        mfaSecret: 'SECRET123'
      })
      ;(speakeasy.totp.verify as jest.Mock).mockReturnValue(true)
      ;(jwt.sign as jest.Mock).mockReturnValue('final-jwt')

      await verify(req, res)

      expect(res.json).toHaveBeenCalledWith({
        verified: true,
        token: 'final-jwt'
      })
    })

    it('should return 400 if user has no mfaSecret', async () => {
      const req: any = {
        headers: {
          authorization: 'Bearer valid-jwt'
        },
        body: { token: '123456' }
      }
      const res = mockResponse()

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: 1,
        type: 'mfa_temp'
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'user@example.com',
        mfaSecret: null
      })

      await verify(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ error: 'MFA not setup' })
    })

    it('should return 400 on invalid token', async () => {
      const req: any = {
        headers: {
          authorization: 'Bearer valid-jwt'
        },
        body: { token: 'wrong' }
      }
      const res = mockResponse()

      ;(jwt.verify as jest.Mock).mockReturnValue({
        userId: 1,
        type: 'mfa_temp'
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'user@example.com',
        mfaSecret: 'SECRET123'
      })
      ;(speakeasy.totp.verify as jest.Mock).mockReturnValue(false)

      await verify(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' })
    })
  })
})

describe('Token error handling', () => {
  it('should return 401 if jwt.verify fails in setup', async () => {
    const req: any = {
      headers: { authorization: 'Bearer invalid-token' }
    }
    const res = mockResponse()

    ;(jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token')
    })

    await setup(req, res)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' })
  })

  it('should return 401 if jwt.verify fails in verify', async () => {
    const req: any = {
      headers: { authorization: 'Bearer invalid-token' },
      body: { token: '123456' }
    }
    const res = mockResponse()

    ;(jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token')
    })

    await verify(req, res)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' })
  })
})
