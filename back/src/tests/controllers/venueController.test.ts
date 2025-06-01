import {
  getAllVenues,
  createVenue,
  updateVenue,
  deleteVenue
} from '../../controllers/venueController'
import prisma from '../../lib/prisma'

jest.mock('../../lib/prisma', () => ({
  venue: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
}))

const mockRes = () => {
  const res: any = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  return res
}

describe('Venue Controller', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getAllVenues', () => {
    it('should return all venues', async () => {
      const req = {} as any
      const res = mockRes()

      const mockVenues = [{ id: 1, name: 'Olympia', city: 'Paris' }]
      ;(prisma.venue.findMany as jest.Mock).mockResolvedValue(mockVenues)

      await getAllVenues(req, res)

      expect(prisma.venue.findMany).toHaveBeenCalled()
      expect(res.json).toHaveBeenCalledWith(mockVenues)
    })
  })

  describe('createVenue', () => {
    it('should create a new venue', async () => {
      const req = {
        body: {
          name: 'Olympia',
          address1: '28 Bd des Capucines',
          address2: '',
          zipCode: '75009',
          city: 'Paris'
        }
      } as any
      const res = mockRes()

      const createdVenue = { id: 1, ...req.body }
      ;(prisma.venue.create as jest.Mock).mockResolvedValue(createdVenue)

      await createVenue(req, res)

      expect(prisma.venue.create).toHaveBeenCalledWith({ data: req.body })
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(createdVenue)
    })

    it('should return 400 on validation error', async () => {
      const req = {
        body: {
          name: '',
          address1: '',
          address2: '',
          zipCode: '',
          city: ''
        }
      } as any
      const res = mockRes()

      await createVenue(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.anything() })
      )
    })
  })

  describe('updateVenue', () => {
    it('should update a venue', async () => {
      const req = {
        params: { id: '1' },
        body: {
          name: 'Updated Venue',
          address1: 'Rue de Test',
          address2: '',
          zipCode: '75000',
          city: 'Paris'
        }
      } as any
      const res = mockRes()

      const updatedVenue = { id: 1, ...req.body }
      ;(prisma.venue.update as jest.Mock).mockResolvedValue(updatedVenue)

      await updateVenue(req, res)

      expect(prisma.venue.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: req.body
      })
      expect(res.json).toHaveBeenCalledWith(updatedVenue)
    })

    it('should return 400 on invalid ID', async () => {
      const req = { params: { id: 'notanumber' }, body: {} } as any
      const res = mockRes()

      await updateVenue(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid ID' })
    })

    it('should return 400 on validation error', async () => {
      const req = {
        params: { id: '1' },
        body: {
          name: '',
          address1: '',
          address2: '',
          zipCode: '',
          city: ''
        }
      } as any
      const res = mockRes()

      await updateVenue(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.anything() })
      )
    })
  })

  describe('deleteVenue', () => {
    it('should delete a venue', async () => {
      const req = { params: { id: '1' } } as any
      const res = mockRes()

      ;(prisma.venue.delete as jest.Mock).mockResolvedValue({})

      await deleteVenue(req, res)

      expect(prisma.venue.delete).toHaveBeenCalledWith({ where: { id: 1 } })
      expect(res.status).toHaveBeenCalledWith(204)
      expect(res.send).toHaveBeenCalled()
    })

    it('should return 400 on invalid ID', async () => {
      const req = { params: { id: 'invalid' } } as any
      const res = mockRes()

      await deleteVenue(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid ID' })
    })

    it('should return 400 on delete error', async () => {
      const req = { params: { id: '1' } } as any
      const res = mockRes()

      ;(prisma.venue.delete as jest.Mock).mockRejectedValue(
        new Error('DB error')
      )

      await deleteVenue(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.anything() })
      )
    })
  })
})
