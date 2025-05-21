// src/tests/ipBanRoutes.test.ts
import request from 'supertest'
import express from 'express'

// Mock prisma globalement
jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    ipBan: {
      findMany: jest.fn()
    }
  }
}))
import prisma from '../lib/prisma'

// Mock authenticateToken pour qu'il appelle next() directement
jest.mock('../middleware/authMiddleware', () => ({
  authenticateToken: jest.fn((req, res, next) => next())
}))

import ipBanRouter from '../routes/ipBan'

describe('GET /ipBan', () => {
  let app: express.Application

  beforeEach(() => {
    app = express()
    app.use('/ipBan', ipBanRouter)
    jest.clearAllMocks()
  })

  it('should return 200 and a list of banned IPs', async () => {
    const fakeBans = [
      {
        ip: '1.2.3.4',
        reason: 'Test ban',
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString()
      },
      {
        ip: '5.6.7.8',
        reason: 'Other ban',
        expiresAt: new Date(Date.now() + 7200 * 1000).toISOString()
      }
    ]
    ;(prisma.ipBan.findMany as jest.Mock).mockResolvedValue(fakeBans)

    const res = await request(app).get('/ipBan')

    expect(prisma.ipBan.findMany).toHaveBeenCalledTimes(1)
    expect(res.status).toBe(200)
    expect(res.body).toEqual(fakeBans)
  })

  it('should call authenticateToken middleware', async () => {
    const spy = jest.spyOn(
      require('../middleware/authMiddleware'),
      'authenticateToken'
    )

    await request(app).get('/ipBan')

    expect(spy).toHaveBeenCalled()
  })
})
