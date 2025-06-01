import {
  getAllShows,
  createShow,
  updateShow,
  deleteShow
} from '../../controllers/showController'
import prisma from '../../lib/prisma'

jest.mock('../../lib/prisma', () => ({
  show: {
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

describe('Show Controller', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getAllShows', () => {
    it('should return all shows with venues', async () => {
      const req = {} as any
      const res = mockRes()

      const mockShows = [
        { id: 1, label: 'Concert', venue: { name: 'bar des forges' } }
      ]
      ;(prisma.show.findMany as jest.Mock).mockResolvedValue(mockShows)

      await getAllShows(req, res)

      expect(prisma.show.findMany).toHaveBeenCalledWith({
        include: { venue: true }
      })
      expect(res.json).toHaveBeenCalledWith(mockShows)
    })
  })

  describe('createShow', () => {
    it('should create a new show', async () => {
      const req = {
        body: { label: 'Concert', date: '2025-12-01', venueId: 2 }
      } as any
      const res = mockRes()

      const createdShow = { id: 1, ...req.body }
      ;(prisma.show.create as jest.Mock).mockResolvedValue(createdShow)

      await createShow(req, res)

      expect(prisma.show.create).toHaveBeenCalledWith({
        data: {
          label: 'Concert',
          date: new Date('2025-12-01'),
          venueId: 2
        }
      })
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(createdShow)
    })

    it('should return 400 on validation error', async () => {
      const req = {
        body: { label: '', date: 'invalid-date', venueId: 'foo' }
      } as any
      const res = mockRes()

      await createShow(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.anything() })
      )
    })
  })

  describe('updateShow', () => {
    it('should update a show', async () => {
      const req = {
        params: { id: '1' },
        body: { label: 'Updated', date: '2025-12-01', venueId: 3 }
      } as any
      const res = mockRes()

      const updatedShow = { id: 1, ...req.body }
      ;(prisma.show.update as jest.Mock).mockResolvedValue(updatedShow)

      await updateShow(req, res)

      expect(prisma.show.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          label: 'Updated',
          date: '2025-12-01',
          venueId: 3
        }
      })
      expect(res.json).toHaveBeenCalledWith(updatedShow)
    })

    it('should return 400 on invalid ID', async () => {
      const req = { params: { id: 'abc' }, body: {} } as any
      const res = mockRes()

      await updateShow(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid ID' })
    })

    it('should return 400 on validation error', async () => {
      const req = {
        params: { id: '1' },
        body: { label: '', date: 'bad', venueId: 'x' }
      } as any
      const res = mockRes()

      await updateShow(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.anything() })
      )
    })
  })

  describe('deleteShow', () => {
    it('should delete a show', async () => {
      const req = { params: { id: '1' } } as any
      const res = mockRes()

      ;(prisma.show.delete as jest.Mock).mockResolvedValue({})

      await deleteShow(req, res)

      expect(prisma.show.delete).toHaveBeenCalledWith({ where: { id: 1 } })
      expect(res.status).toHaveBeenCalledWith(204)
      expect(res.send).toHaveBeenCalled()
    })

    it('should return 400 on invalid ID', async () => {
      const req = { params: { id: 'bad' } } as any
      const res = mockRes()

      await deleteShow(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid ID' })
    })

    it('should return 400 on error during delete', async () => {
      const req = { params: { id: '1' } } as any
      const res = mockRes()

      ;(prisma.show.delete as jest.Mock).mockRejectedValue(
        new Error('DB error')
      )

      await deleteShow(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.anything() })
      )
    })
  })
})
