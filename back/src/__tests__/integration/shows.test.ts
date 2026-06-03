import request from 'supertest'
import jwt from 'jsonwebtoken'

jest.mock('../../lib/prisma', () => ({
  default: {
    show: { findMany: jest.fn(), create: jest.fn() },
    ipBan: {
      findUnique: jest.fn().mockResolvedValue(null),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  },
}))

import prisma from '../../lib/prisma'
import { buildTestApp } from '../helpers/testApp'

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const app = buildTestApp()

const SECRET = 'test-secret-for-jest-at-least-32-chars'
process.env.JWT_SECRET = SECRET

function authHeader() {
  return `Bearer ${jwt.sign({ userId: 1, email: 'user@test.com' }, SECRET, { expiresIn: '1h' })}`
}

const fakeShow = {
  id: 1, label: 'Concert été', date: '2025-07-14T20:00:00.000Z', venueId: 1,
  venue: { id: 1, name: 'Le Zénith', city: 'Paris' },
}

describe('GET /api/shows', () => {
  beforeEach(() => jest.clearAllMocks())

  it('retourne la liste des shows (public, sans auth)', async () => {
    mockPrisma.show.findMany.mockResolvedValue([fakeShow] as never)

    const res = await request(app).get('/api/shows')

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0]).toMatchObject({ label: 'Concert été' })
  })

  it('inclut les données de venue', async () => {
    mockPrisma.show.findMany.mockResolvedValue([fakeShow] as never)

    const res = await request(app).get('/api/shows')

    expect(res.body[0].venue).toMatchObject({ name: 'Le Zénith', city: 'Paris' })
  })
})

describe('POST /api/shows', () => {
  const validPayload = { label: 'Nouveau concert', date: '2025-08-01T20:00:00.000Z', venueId: 1 }

  beforeEach(() => jest.clearAllMocks())

  it('retourne 401 sans token', async () => {
    const res = await request(app).post('/api/shows').send(validPayload)
    expect(res.status).toBe(401)
    expect(mockPrisma.show.create).not.toHaveBeenCalled()
  })

  it('crée un show et retourne 201 avec token valide', async () => {
    mockPrisma.show.create.mockResolvedValue({ id: 2, ...validPayload } as never)

    const res = await request(app)
      .post('/api/shows')
      .set('Authorization', authHeader())
      .send(validPayload)

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ label: 'Nouveau concert' })
  })

  it('retourne 400 si label absent', async () => {
    const res = await request(app)
      .post('/api/shows')
      .set('Authorization', authHeader())
      .send({ date: '2025-08-01T20:00:00.000Z', venueId: 1 })

    expect(res.status).toBe(400)
    expect(mockPrisma.show.create).not.toHaveBeenCalled()
  })

  it('retourne 400 si date invalide', async () => {
    const res = await request(app)
      .post('/api/shows')
      .set('Authorization', authHeader())
      .send({ label: 'Test', date: 'pas-une-date', venueId: 1 })

    expect(res.status).toBe(400)
  })
})
