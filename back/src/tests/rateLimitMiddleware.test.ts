import express from 'express'
import request from 'supertest'
import { loginLimiter } from '../middleware/rateLimiterMiddleware'

describe('loginLimiter middleware', () => {
  let app: express.Application

  beforeEach(() => {
    app = express()
    app.use('/login', loginLimiter, (req, res) => {
      res.status(200).send('Login route OK')
    })
  })

  it('should allow up to 3 requests per 15 minutes', async () => {
    for (let i = 1; i <= 3; i++) {
      const res = await request(app).get('/login')
      expect(res.status).toBe(200)
      expect(res.text).toBe('Login route OK')
      expect(res.headers['ratelimit-limit']).toBeDefined()
    }
  })

  it('should block on 4th request with correct message', async () => {
    // Enchaîne 4 requêtes
    for (let i = 0; i < 3; i++) {
      await request(app).get('/login')
    }
    const res = await request(app).get('/login')

    expect(res.status).toBe(429)
    expect(res.text).toBe(
      'Too many login attempts from this IP, please try again after 15 minutes'
    )
    expect(res.headers['ratelimit-remaining']).toBe('0')
    expect(res.headers['ratelimit-reset']).toBeDefined()
  })
})
