import express from 'express'
import request from 'supertest'

// Mock complet du module middleware
jest.mock('../../middleware/authMiddleware', () => ({
  authenticateToken: jest.fn((req, res, next) => next())
}))

import * as authMiddleware from '../../middleware/authMiddleware' // Après le jest.mock
import venueRouter from '../../router/venues'

// Mock des contrôleurs
jest.mock('../../controllers/venueController', () => ({
  getAllVenues: jest.fn((req, res) => res.status(200).send('getAllVenues')),
  createVenue: jest.fn((req, res) => res.status(201).send('createVenue')),
  updateVenue: jest.fn((req, res) => res.status(200).send('updateVenue')),
  deleteVenue: jest.fn((req, res) => res.status(200).send('deleteVenue'))
}))

describe('Venue routes', () => {
  let app: express.Express

  beforeAll(() => {
    app = express()
    const router = express.Router()
    venueRouter(router)
    app.use(router)
  })

  it('GET /venues should be public and return 200', async () => {
    const res = await request(app).get('/venues')
    expect(res.status).toBe(200)
    expect(res.text).toBe('getAllVenues')
  })

  it('POST /venues should require auth and call createVenue', async () => {
    const res = await request(app).post('/venues')

    expect(authMiddleware.authenticateToken).toHaveBeenCalled()
    expect(res.status).toBe(201)
    expect(res.text).toBe('createVenue')
  })

  it('PUT /venues/:id should require auth and call updateVenue', async () => {
    const res = await request(app).put('/venues/123')

    expect(authMiddleware.authenticateToken).toHaveBeenCalled()
    expect(res.status).toBe(200)
    expect(res.text).toBe('updateVenue')
  })

  it('DELETE /venues/:id should be public and call deleteVenue', async () => {
    const res = await request(app).delete('/venues/123')
    expect(res.status).toBe(200)
    expect(res.text).toBe('deleteVenue')
  })
})
