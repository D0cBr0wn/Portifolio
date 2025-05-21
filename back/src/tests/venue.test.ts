// src/tests/venue.test.ts
import request from 'supertest'
import express, { Request, Response, NextFunction } from 'express'
import venueRouter from '../routes/venue'
import prisma from '../lib/prisma'
import * as authMiddleware from '../middleware/authMiddleware'

// Mock prisma
jest.mock('../lib/prisma', () => ({
  venue: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
}))

// Mock authenticateToken middleware
jest.mock('../middleware/authMiddleware', () => ({
  authenticateToken: jest.fn(
    (req: Request, res: Response, next: NextFunction) => next()
  )
}))

describe('Venue Routes', () => {
  let app: express.Application

  beforeEach(() => {
    app = express()
    app.use(express.json())
    app.use('/venues', venueRouter)
    jest.clearAllMocks()
  })

  describe('GET /venues', () => {
    it('should return 200 and list of venues', async () => {
      const fakeVenues = [
        {
          id: 1,
          name: 'Venue 1',
          address1: 'Addr1',
          address2: 'Addr2',
          zipCode: '12345',
          city: 'CityA'
        },
        {
          id: 2,
          name: 'Venue 2',
          address1: 'Addr3',
          address2: '',
          zipCode: '67890',
          city: 'CityB'
        }
      ]
      ;(prisma.venue.findMany as jest.Mock).mockResolvedValue(fakeVenues)

      const res = await request(app).get('/venues')

      expect(authMiddleware.authenticateToken).toHaveBeenCalled()
      expect(prisma.venue.findMany).toHaveBeenCalled()
      expect(res.status).toBe(200)
      expect(res.body).toEqual(fakeVenues)
    })
  })

  describe('POST /venues', () => {
    it('should create a venue and return 201', async () => {
      const newVenue = {
        name: 'New Venue',
        address1: 'Addr1',
        address2: 'Addr2',
        zipCode: '54321',
        city: 'CityZ'
      }
      const createdVenue = { id: 10, ...newVenue }
      ;(prisma.venue.create as jest.Mock).mockResolvedValue(createdVenue)

      const res = await request(app).post('/venues').send(newVenue)

      expect(authMiddleware.authenticateToken).toHaveBeenCalled()
      expect(prisma.venue.create).toHaveBeenCalledWith({ data: newVenue })
      expect(res.status).toBe(201)
      expect(res.body).toEqual(createdVenue)
    })

    it('should return 400 if validation fails', async () => {
      const invalidVenue = {
        name: '', // empty name (min 1)
        address1: 'Addr1',
        address2: '',
        zipCode: '54321',
        city: '' // empty city
      }

      const res = await request(app).post('/venues').send(invalidVenue)

      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error')
    })
  })

  describe('PUT /venues/:id', () => {
    it('should update and return venue', async () => {
      const id = 5
      const updateData = {
        name: 'Updated Venue',
        address1: 'New Addr1',
        address2: 'New Addr2',
        zipCode: '11111',
        city: 'New City'
      }
      const updatedVenue = { id, ...updateData }
      ;(prisma.venue.update as jest.Mock).mockResolvedValue(updatedVenue)

      const res = await request(app).put(`/venues/${id}`).send(updateData)

      expect(authMiddleware.authenticateToken).toHaveBeenCalled()
      expect(prisma.venue.update).toHaveBeenCalledWith({
        where: { id },
        data: updateData
      })
      expect(res.status).toBe(200)
      expect(res.body).toEqual(updatedVenue)
    })

    it('should return 400 if id invalid', async () => {
      const res = await request(app).put('/venues/abc').send({
        name: 'Venue',
        address1: 'Addr1',
        address2: '',
        zipCode: '12345',
        city: 'City'
      })

      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error')
    })

    it('should return 400 if validation fails', async () => {
      const id = 3
      const invalidData = {
        name: '', // invalid
        address1: 'Addr1',
        address2: '',
        zipCode: '54321',
        city: ''
      }

      const res = await request(app).put(`/venues/${id}`).send(invalidData)

      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error')
    })
  })

  describe('DELETE /venues/:id', () => {
    it('should delete venue and return 204', async () => {
      const id = 10
      ;(prisma.venue.delete as jest.Mock).mockResolvedValue({})

      const res = await request(app).delete(`/venues/${id}`)

      expect(authMiddleware.authenticateToken).toHaveBeenCalled()
      expect(prisma.venue.delete).toHaveBeenCalledWith({ where: { id } })
      expect(res.status).toBe(204)
    })

    it('should return 400 if id invalid', async () => {
      const res = await request(app).delete('/venues/xyz')

      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error')
    })

    it('should return 400 if prisma.delete throws', async () => {
      const id = 11
      ;(prisma.venue.delete as jest.Mock).mockRejectedValue(
        new Error('Delete error')
      )

      const res = await request(app).delete(`/venues/${id}`)

      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error')
    })
  })
})
