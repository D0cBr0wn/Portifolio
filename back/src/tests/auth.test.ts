import request from 'supertest'
import express from 'express'
import { NextFunction, Request, Response } from 'express'
import router from '../routes/auth' // adapte le chemin
import prisma from '../lib/prisma'
import * as sendAlerts from '../utils/sendAlerts'
import bcrypt from 'bcryptjs'

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    ipBan: {
      upsert: jest.fn()
      // ajoute d'autres méthodes si nécessaire
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn()
      // ajoute d'autres méthodes si nécessaire
    },
    failedLoginAttempt: {
      create: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn()
    }
    // ajoute d'autres modèles si utilisés
  }
}))
jest.mock('../utils/sendAlerts')
// Mock du rate limiter pour qu'il appelle next() directement
jest.mock('../middleware/rateLimiterMiddleware', () => ({
  loginLimiter: (req: Request, res: Response, next: NextFunction) => next()
}))

describe('Auth routes', () => {
  let app: express.Application

  beforeEach(() => {
    app = express()
    app.use(express.json())
    app.use(router)

    jest.clearAllMocks()
  })

  it('should return 400 on invalid input', async () => {
    const res = await request(app)
      .post('/login')
      .send({ email: 'not-an-email' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Invalid input')
  })

  it('should deny access and ban IP if email contains admin', async () => {
    const ip = '1.2.3.4'
    ;(prisma.ipBan.upsert as jest.Mock) = jest.fn()
    ;(sendAlerts.sendAdminBanAlert as jest.Mock) = jest.fn()

    const res = await request(app)
      .post('/login')
      .set('X-Forwarded-For', ip)
      .send({ email: 'admin@example.com', password: 'password123' })

    expect(res.status).toBe(403)
    expect(prisma.ipBan.upsert).toHaveBeenCalled()
    expect(sendAlerts.sendAdminBanAlert).toHaveBeenCalled()
  })

  it('should deny access on wrong password and call handleFailedLogin', async () => {
    const fakeUser = {
      id: 1,
      email: 'user@example.com',
      password: await bcrypt.hash('correctpassword', 10)
    }

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(fakeUser)
    const handleFailedLoginMock = jest
      .spyOn(
        require('../middleware/loginAttemptMiddleware'),
        'handleFailedLogin'
      )
      .mockImplementation(jest.fn())

    const res = await request(app)
      .post('/login')
      .send({ email: 'user@example.com', password: 'wrongpassword' })

    expect(res.status).toBe(401)
    expect(handleFailedLoginMock).toHaveBeenCalledWith(
      expect.any(String),
      'user@example.com'
    )

    handleFailedLoginMock.mockRestore()
  })

  it('should return token on successful login', async () => {
    const fakeUser = {
      id: 1,
      email: 'user@example.com',
      password: await bcrypt.hash('password123', 10)
    }
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(fakeUser)

    const res = await request(app)
      .post('/login')
      .send({ email: 'user@example.com', password: 'password123' })

    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
  })
})
