import express from 'express'
import request from 'supertest'
import * as authMiddleware from '../../middleware/authMiddleware'

// Mock des contrôleurs
jest.mock('../../controllers/showController', () => ({
  getAllShows: jest.fn((req, res) => res.status(200).send('getAllShows')),
  createShow: jest.fn((req, res) => res.status(201).send('createShow')),
  updateShow: jest.fn((req, res) => res.status(200).send('updateShow')),
  deleteShow: jest.fn((req, res) => res.status(200).send('deleteShow'))
}))

// Ici, mock avant import du router
jest.mock('../../middleware/authMiddleware', () => ({
  authenticateToken: jest.fn(async (req, res, next) => next())
}))

import createRouter from '../../router/index' // Import après le mock

describe('Show routes', () => {
  let app: express.Express

  beforeAll(() => {
    app = express()
    const router = createRouter()
    app.use(router)
  })

  it('GET /shows should be public and return 200', async () => {
    const res = await request(app).get('/shows')
    expect(res.status).toBe(200)
    expect(res.text).toBe('getAllShows')
  })

  it('POST /shows should require auth and call createShow', async () => {
    const authSpy = authMiddleware.authenticateToken as jest.Mock

    const res = await request(app).post('/shows')

    expect(authSpy).toHaveBeenCalled()
    expect(res.status).toBe(201)
    expect(res.text).toBe('createShow')
  })

  it('PUT /shows/:id should require auth and call updateShow', async () => {
    const authSpy = authMiddleware.authenticateToken as jest.Mock

    const res = await request(app).put('/shows/123')

    expect(authSpy).toHaveBeenCalled()
    expect(res.status).toBe(200)
    expect(res.text).toBe('updateShow')
  })

  it('DELETE /shows/:id should be public and call deleteShow', async () => {
    const res = await request(app).delete('/shows/123')
    expect(res.status).toBe(200)
    expect(res.text).toBe('deleteShow')
  })
})
