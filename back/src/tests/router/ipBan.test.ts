import express from 'express'
import request from 'supertest'
import ipBanRouter from '../../router/ipBan'
import prisma from '../../lib/prisma'

// Mock du middleware d'authentification
jest.mock('../../middleware/authMiddleware', () => ({
  authenticateToken: jest.fn((req, res, next) => next())
}))

// Mock Prisma
jest.mock('../../lib/prisma', () => ({
  ipBan: {
    findMany: jest.fn(() => Promise.resolve([{ ip: '127.0.0.1' }]))
  }
}))

describe('GET /ipban', () => {
  let app: express.Express

  beforeAll(() => {
    app = express()
    app.use(express.json())
    app.use('/ipban', ipBanRouter)
  })

  it('should require authentication', async () => {
    const res = await request(app).get('/ipban')

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body[0].ip).toBe('127.0.0.1')

    // Vérifie que le mock de Prisma a bien été appelé
    expect(prisma.ipBan.findMany).toHaveBeenCalled()
  })
})
