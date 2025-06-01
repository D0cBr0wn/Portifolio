// src/tests/router/mfa.test.ts
import express from 'express'
import request from 'supertest'
import mfaRouter from '../../router/mfa'

// Mock des contrôleurs
jest.mock('../../controllers/mfaController', () => ({
  setup: jest.fn((req, res) => res.status(200).send('setup')),
  verify: jest.fn((req, res) => res.status(200).send('verify'))
}))

describe('MFA routes', () => {
  let app: express.Express

  beforeAll(() => {
    app = express()
    app.use(express.json())
    const router = express.Router()
    mfaRouter(router)
    app.use(router)
  })

  it('POST /mfa/setup should return 200 and call setup', async () => {
    const res = await request(app).post('/mfa/setup')
    expect(res.status).toBe(200)
    expect(res.text).toBe('setup')
  })

  it('POST /mfa/verify should return 200 and call verify', async () => {
    const res = await request(app).post('/mfa/verify')
    expect(res.status).toBe(200)
    expect(res.text).toBe('verify')
  })
})
