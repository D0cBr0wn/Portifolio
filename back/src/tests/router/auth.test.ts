import express from 'express'
import request from 'supertest'
import createRouter from '../../router/index'

// Mock du contrôleur de login pour éviter la logique métier
jest.mock('../../controllers/authController', () => ({
  login: jest.fn((req, res) => res.status(200).send('login')),
  register: jest.fn((req, res) => res.status(201).send('register'))
}))

describe('Auth rate limiting', () => {
  let app: express.Express

  beforeEach(() => {
    app = express()
    app.use(express.json())
    const router = createRouter()
    app.use(router)
  })

  it('should allow 3 login attempts, then block the 4th', async () => {
    for (let i = 1; i <= 3; i++) {
      const res = await request(app).post('/auth/login')
      expect(res.status).toBe(200)
      expect(res.text).toBe('login')
    }

    const blocked = await request(app).post('/auth/login')

    expect(blocked.status).toBe(429)
    expect(blocked.text).toContain('Too many login attempts from this IP')
  })
})
