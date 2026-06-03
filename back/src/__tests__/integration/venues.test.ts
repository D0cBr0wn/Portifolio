import request from 'supertest'
import jwt from 'jsonwebtoken'

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    venue: { findMany: jest.fn(), create: jest.fn() },
    ipBan: {
      findUnique: jest.fn().mockResolvedValue(null),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  },
}))

import prisma from '../../lib/prisma'
import { buildTestApp } from '../helpers/testApp'

const venueMock = prisma.venue as unknown as { findMany: jest.Mock; create: jest.Mock }
const app = buildTestApp()

const SECRET = 'test-secret-for-jest-at-least-32-chars'
process.env.JWT_SECRET = SECRET

function authHeader() {
  return `Bearer ${jwt.sign({ userId: 1, email: 'user@test.com' }, SECRET, { expiresIn: '1h' })}`
}

describe('GET /api/venues', () => {
  beforeEach(() => jest.clearAllMocks())

  it('retourne la liste des venues (public, sans auth)', async () => {
    venueMock.findMany.mockResolvedValue([
      { id: 1, name: 'Le Zénith', city: 'Paris', address1: null, address2: null, zipCode: null },
    ])

    const res = await request(app).get('/api/venues')

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].name).toBe('Le Zénith')
  })
})

describe('POST /api/venues', () => {
  beforeEach(() => jest.clearAllMocks())

  it('retourne 401 sans token', async () => {
    const res = await request(app)
      .post('/api/venues')
      .send({ name: 'Le Bataclan', city: 'Paris' })

    expect(res.status).toBe(401)
    expect(venueMock.create).not.toHaveBeenCalled()
  })

  it('crée une venue et retourne 201 avec token valide', async () => {
    venueMock.create.mockResolvedValue(
      { id: 1, name: 'Le Bataclan', city: 'Paris', address1: null, address2: null, zipCode: null }
    )

    const res = await request(app)
      .post('/api/venues')
      .set('Authorization', authHeader())
      .send({ name: 'Le Bataclan', city: 'Paris' })

    expect(res.status).toBe(201)
    expect(res.body.name).toBe('Le Bataclan')
  })

  it('accepte les champs optionnels address1, address2, zipCode', async () => {
    const payload = { name: 'Le Zénith', city: 'Paris', address1: '211 Av. Jean Jaurès', zipCode: '75019' }
    venueMock.create.mockResolvedValue({ id: 2, ...payload, address2: null })

    const res = await request(app)
      .post('/api/venues')
      .set('Authorization', authHeader())
      .send(payload)

    expect(res.status).toBe(201)
    expect(venueMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ address1: '211 Av. Jean Jaurès' }) })
    )
  })

  it('retourne 400 si name absent', async () => {
    const res = await request(app)
      .post('/api/venues')
      .set('Authorization', authHeader())
      .send({ city: 'Paris' })

    expect(res.status).toBe(400)
    expect(venueMock.create).not.toHaveBeenCalled()
  })

  it('retourne 400 si city vide', async () => {
    const res = await request(app)
      .post('/api/venues')
      .set('Authorization', authHeader())
      .send({ name: 'Test', city: '' })

    expect(res.status).toBe(400)
  })

  it('retourne 403 si token expiré', async () => {
    const expiredToken = jwt.sign({ userId: 1, email: 'u@t.com' }, SECRET, { expiresIn: -1 })

    const res = await request(app)
      .post('/api/venues')
      .set('Authorization', `Bearer ${expiredToken}`)
      .send({ name: 'Test', city: 'Lyon' })

    expect(res.status).toBe(403)
  })
})
