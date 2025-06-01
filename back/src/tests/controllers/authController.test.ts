import { register, login } from '../../controllers/authController'
import bcrypt from 'bcryptjs'
import prisma from '../../lib/prisma'
import { createMfaTempToken } from '../../helpers/mfaHelper'
import {
  handleFailedLogin,
  shouldBanEmail
} from '../../helpers/loginAttemptHelper'

jest.mock('bcryptjs')
jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn()
    }
  }
}))
jest.mock('../../helpers/mfaHelper')
jest.mock('../../helpers/loginAttemptHelper')

const mockResponse = () => {
  const res: any = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  return res
}

describe('Auth Controller', () => {
  afterEach(() => jest.clearAllMocks())

  describe('register', () => {
    it('should register a user with valid data', async () => {
      const req: any = {
        body: { email: 'test@example.com', password: 'password123' }
      }
      const res = mockResponse()

      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: 1,
        email: req.body.email
      })

      await register(req, res)

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10)
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { email: 'test@example.com', password: 'hashedPassword' }
      })
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({
        id: 1,
        email: 'test@example.com'
      })
    })

    it('should return 400 on invalid input', async () => {
      const req: any = { body: { email: 'bademail', password: '123' } }
      const res = mockResponse()

      await register(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid input' })
    })
  })

  describe('login', () => {
    it('should deny access for unknown user', async () => {
      const req: any = {
        body: { email: 'unknown@example.com', password: 'wrongpass' },
        ip: '1.2.3.4'
      }
      const res = mockResponse()
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
      ;(shouldBanEmail as jest.Mock).mockResolvedValue(false)

      await login(req, res)

      expect(handleFailedLogin).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ error: 'Access denied' })
    })

    it('should deny access for banned user', async () => {
      const req: any = {
        body: { email: 'banned@example.com', password: 'correctpass' },
        ip: '1.2.3.4'
      }
      const user = {
        email: 'banned@example.com',
        password: 'hashedpass',
        banUntil: new Date(Date.now() + 100000),
        mfaSecret: null
      }
      const res = mockResponse()

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(user)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      ;(shouldBanEmail as jest.Mock).mockResolvedValue(true)

      await login(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({ error: 'Access denied' })
    })

    it('should require MFA when secret is set but no code is sent', async () => {
      const req: any = {
        body: { email: 'mfa@example.com', password: 'pass123' },
        ip: '1.2.3.4'
      }
      const user = {
        email: 'mfa@example.com',
        password: 'hashed',
        mfaSecret: 'secret',
        banUntil: null
      }
      const res = mockResponse()

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(user)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      ;(shouldBanEmail as jest.Mock).mockResolvedValue(false)
      ;(createMfaTempToken as jest.Mock).mockReturnValue('mfa-token')

      await login(req, res)

      expect(res.status).toHaveBeenCalledWith(206)
      expect(res.json).toHaveBeenCalledWith({
        mfaRequired: true,
        token: 'mfa-token',
        message: 'MFA required'
      })
    })

    it('should return MFA setup required when no secret is set', async () => {
      const req: any = {
        body: { email: 'setup@example.com', password: 'pass123' },
        ip: '1.2.3.4'
      }
      const user = {
        email: 'setup@example.com',
        password: 'hashed',
        mfaSecret: null,
        banUntil: null
      }
      const res = mockResponse()

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(user)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      ;(shouldBanEmail as jest.Mock).mockResolvedValue(false)
      ;(createMfaTempToken as jest.Mock).mockReturnValue('setup-token')

      await login(req, res)

      expect(res.status).toHaveBeenCalledWith(203)
      expect(res.json).toHaveBeenCalledWith({
        mfaSetupRequired: true,
        token: 'setup-token',
        message: 'MFA setup required'
      })
    })

    it('should return 400 on invalid input', async () => {
      const req: any = {
        body: { email: 'invalid', password: '1' },
        ip: '1.2.3.4'
      }
      const res = mockResponse()

      await login(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid input' })
    })
  })
})
