// src/tests/show.test.ts
import request from 'supertest'
import express, { Request, Response, NextFunction } from 'express'
import showRouter from '../router/shows'
import prisma from '../lib/prisma'
import * as authMiddleware from '../middleware/authMiddleware'

// Mock prisma
jest.mock('../lib/prisma', () => ({
  show: {
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

describe('Show Routes', () => {
  let app: express.Application

  beforeEach(() => {
    app = express()
    app.use(express.json())
    app.use('/shows', showRouter)
    jest.clearAllMocks()
  })

  describe('GET /shows', () => {
    it('should return 200 and a list of shows', async () => {
      const fakeShows = [
        {
          id: 1,
          label: 'Concert 1',
          date: new Date().toISOString(),
          venueId: 10,
          venue: { id: 10, name: 'Venue A' }
        },
        {
          id: 2,
          label: 'Concert 2',
          date: new Date().toISOString(),
          venueId: 11,
          venue: { id: 11, name: 'Venue B' }
        }
      ]
      ;(prisma.show.findMany as jest.Mock).mockResolvedValue(fakeShows)

      const res = await request(app).get('/shows')

      expect(prisma.show.findMany).toHaveBeenCalledWith({
        include: { venue: true }
      })
      expect(res.status).toBe(200)
      expect(res.body).toEqual(fakeShows)
    })
  })

  describe('POST /shows', () => {
    it('should create a new show and return 201', async () => {
      const newShow = {
        label: 'New Concert',
        date: new Date().toISOString(),
        venueId: 15
      }
      const createdShow = {
        id: 123,
        ...newShow,
        date: new Date(newShow.date).toISOString()
      }
      ;(prisma.show.create as jest.Mock).mockResolvedValue(createdShow)

      const res = await request(app).post('/shows').send(newShow)

      expect(authMiddleware.authenticateToken).toHaveBeenCalled()
      expect(prisma.show.create).toHaveBeenCalledWith({
        data: {
          label: newShow.label,
          date: new Date(newShow.date),
          venueId: newShow.venueId
        }
      })
      expect(res.status).toBe(201)
      expect(res.body).toEqual(createdShow)
    })

    it('should return 400 if validation fails', async () => {
      const invalidShow = { label: '', date: 'not-a-date', venueId: 0 }

      const res = await request(app).post('/shows').send(invalidShow)

      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error')
    })
  })

  describe('PUT /shows/:id', () => {
    it('should update and return the show', async () => {
      const id = 5
      const updateData = {
        label: 'Updated Show',
        date: new Date().toISOString(),
        venueId: 20
      }
      const updatedShow = { id, ...updateData }

      ;(prisma.show.update as jest.Mock).mockResolvedValue(updatedShow)

      const res = await request(app).put(`/shows/${id}`).send(updateData)

      expect(authMiddleware.authenticateToken).toHaveBeenCalled()
      expect(prisma.show.update).toHaveBeenCalledWith({
        where: { id },
        data: updateData
      })
      expect(res.status).toBe(200)
      expect(res.body).toEqual(updatedShow)
    })

    it('should return 400 if invalid id', async () => {
      const res = await request(app).put('/shows/invalid').send({
        label: 'Show',
        date: new Date().toISOString(),
        venueId: 1
      })

      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error')
    })

    it('should return 400 if validation fails', async () => {
      const id = 3
      const invalidData = { label: '', date: 'bad-date', venueId: 0 }

      const res = await request(app).put(`/shows/${id}`).send(invalidData)

      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error')
    })
  })

  describe('DELETE /shows/:id', () => {
    it('should delete a show and return 204', async () => {
      const id = 10
      ;(prisma.show.delete as jest.Mock).mockResolvedValue({})

      const res = await request(app).delete(`/shows/${id}`)

      expect(authMiddleware.authenticateToken).toHaveBeenCalled()
      expect(prisma.show.delete).toHaveBeenCalledWith({ where: { id } })
      expect(res.status).toBe(204)
    })

    it('should return 400 if invalid id', async () => {
      const res = await request(app).delete('/shows/abc')

      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error')
    })

    it('should return 400 if prisma.delete throws', async () => {
      const id = 15
      ;(prisma.show.delete as jest.Mock).mockRejectedValue(
        new Error('Delete failed')
      )

      const res = await request(app).delete(`/shows/${id}`)

      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error')
    })
  })
})
