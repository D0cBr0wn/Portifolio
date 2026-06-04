import request from 'supertest'
import jwt from 'jsonwebtoken'

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    show: { findMany: jest.fn() },
    venue: { findMany: jest.fn() },
    ipBan: {
      findUnique: jest.fn().mockResolvedValue(null),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  },
}))

import prisma from '../../lib/prisma'
import { buildTestApp } from '../helpers/testApp'

const showMock = prisma.show as unknown as { findMany: jest.Mock }
const venueMock = prisma.venue as unknown as { findMany: jest.Mock }
const app = buildTestApp()

const SECRET = 'test-secret-for-jest-at-least-32-chars'
process.env.JWT_SECRET = SECRET

function makeToken(role: 'USER' | 'ADMIN') {
  return `Bearer ${jwt.sign({ userId: 1, email: 'test@test.com', role }, SECRET, { expiresIn: '1h' })}`
}

const fakeShow = {
  id: 1,
  label: 'Concert été',
  date: '2025-07-14T20:00:00.000Z',
  venueId: 1,
  createdById: 1,
  venue: { id: 1, name: 'Le Zénith', city: 'Paris' },
  createdBy: { email: 'admin@test.com' },
}

const fakeVenue = {
  id: 1,
  name: 'Le Zénith',
  city: 'Paris',
  createdById: 1,
  createdBy: { email: 'admin@test.com' },
}

describe('GET /api/backoffice/shows', () => {
  beforeEach(() => jest.clearAllMocks())

  it('retourne 401 sans token', async () => {
    const res = await request(app).get('/api/backoffice/shows')
    expect(res.status).toBe(401)
    expect(showMock.findMany).not.toHaveBeenCalled()
  })

  it('retourne 403 avec token USER', async () => {
    const res = await request(app)
      .get('/api/backoffice/shows')
      .set('Authorization', makeToken('USER'))
    expect(res.status).toBe(403)
    expect(showMock.findMany).not.toHaveBeenCalled()
  })

  it('retourne 200 avec la liste et createdBy si ADMIN', async () => {
    showMock.findMany.mockResolvedValue([fakeShow])

    const res = await request(app)
      .get('/api/backoffice/shows')
      .set('Authorization', makeToken('ADMIN'))

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].createdBy).toEqual({ email: 'admin@test.com' })
  })

  it('retourne createdBy: null si show sans créateur', async () => {
    showMock.findMany.mockResolvedValue([{ ...fakeShow, createdBy: null, createdById: null }])

    const res = await request(app)
      .get('/api/backoffice/shows')
      .set('Authorization', makeToken('ADMIN'))

    expect(res.status).toBe(200)
    expect(res.body[0].createdBy).toBeNull()
  })
})

describe('GET /api/backoffice/venues', () => {
  beforeEach(() => jest.clearAllMocks())

  it('retourne 401 sans token', async () => {
    const res = await request(app).get('/api/backoffice/venues')
    expect(res.status).toBe(401)
    expect(venueMock.findMany).not.toHaveBeenCalled()
  })

  it('retourne 403 avec token USER', async () => {
    const res = await request(app)
      .get('/api/backoffice/venues')
      .set('Authorization', makeToken('USER'))
    expect(res.status).toBe(403)
    expect(venueMock.findMany).not.toHaveBeenCalled()
  })

  it('retourne 200 avec la liste et createdBy si ADMIN', async () => {
    venueMock.findMany.mockResolvedValue([fakeVenue])

    const res = await request(app)
      .get('/api/backoffice/venues')
      .set('Authorization', makeToken('ADMIN'))

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].createdBy).toEqual({ email: 'admin@test.com' })
  })

  it('retourne createdBy: null si venue sans créateur', async () => {
    venueMock.findMany.mockResolvedValue([{ ...fakeVenue, createdBy: null, createdById: null }])

    const res = await request(app)
      .get('/api/backoffice/venues')
      .set('Authorization', makeToken('ADMIN'))

    expect(res.status).toBe(200)
    expect(res.body[0].createdBy).toBeNull()
  })
})
