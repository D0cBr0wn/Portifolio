import express from 'express'
import request from 'supertest'
import { loginLimiter } from '../../middleware/rateLimiterMiddleware' // ajuste le chemin

const app = express()

// Middleware à tester sur la route /login
app.post('/login', loginLimiter, (req, res) => {
  res.status(200).send('Login route')
})

describe('loginLimiter middleware', () => {
  it('should allow up to max requests', async () => {
    for (let i = 0; i < 3; i++) {
      const res = await request(app).post('/login')
      expect(res.status).toBe(200)
    }
  })

  it('should block after max requests', async () => {
    for (let i = 0; i < 3; i++) {
      await request(app).post('/login')
    }

    const res = await request(app).post('/login')
    expect(res.status).toBe(429) // Too Many Requests
    expect(res.text).toBe(
      'Too many login attempts from this IP, please try again after 15 minutes'
    )
  })
})
