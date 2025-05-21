// src/tests/ipBanMiddleware.test.ts
import request from 'supertest'
import express from 'express'
import { ipBanCheck } from '../middleware/ipBanMiddleware'

// mock prisma globalement (depuis src/lib/prisma.ts)
jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    ipBan: {
      deleteMany: jest.fn(),
      findUnique: jest.fn()
    }
  }
}))

import prisma from '../lib/prisma' // doit être après jest.mock

describe('ipBanCheck middleware', () => {
  let app: express.Application

  beforeEach(() => {
    app = express()
    app.set('trust proxy', true)
    app.use(ipBanCheck)
    app.get('/', function (req, res) {
      res.status(200).send('ok')
    })

    jest.clearAllMocks()
  })

  it('should return 403 if IP is banned', async () => {
    ;(prisma.ipBan.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
    ;(prisma.ipBan.findUnique as jest.Mock).mockResolvedValue({
      ip: '1.2.3.4',
      expiresAt: new Date(Date.now() + 10000)
    })

    const res = await request(app).get('/').set('X-Forwarded-For', '1.2.3.4')
    expect(res.status).toBe(403)
  })

  it('should allow request if IP not banned', async () => {
    ;(prisma.ipBan.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
    ;(prisma.ipBan.findUnique as jest.Mock).mockResolvedValue(null)

    const res = await request(app).get('/').set('X-Forwarded-For', '5.6.7.8')
    expect(res.status).toBe(200)
  })
})
