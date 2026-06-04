import request from 'supertest'
import jwt from 'jsonwebtoken'

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    venue: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    ipBan: {
      findUnique: jest.fn().mockResolvedValue(null),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  },
}))

import prisma from '../../lib/prisma'
import { buildTestApp } from '../helpers/testApp'

const venueMock = prisma.venue as unknown as {
  findMany: jest.Mock
  create: jest.Mock
  update: jest.Mock
  delete: jest.Mock
}
const app = buildTestApp()

const SECRET = 'test-secret-for-jest-at-least-32-chars'
process.env.JWT_SECRET = SECRET

function authHeader() {
  return `Bearer ${jwt.sign({ userId: 1, email: 'user@test.com', role: 'USER' }, SECRET, { expiresIn: '1h' })}`
}

const fakeVenue = { id: 1, name: 'Le Zénith', city: 'Paris', address1: null, address2: null, zipCode: null }

describe('GET /api/venues', () => {
  beforeEach(() => jest.clearAllMocks())

  it('retourne la liste des venues (public, sans auth)', async () => {
    venueMock.findMany.mockResolvedValue([fakeVenue])

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
    venueMock.create.mockResolvedValue(fakeVenue)

    const res = await request(app)
      .post('/api/venues')
      .set('Authorization', authHeader())
      .send({ name: 'Le Bataclan', city: 'Paris' })

    expect(res.status).toBe(201)
    expect(res.body.name).toBe('Le Zénith')
    expect(venueMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ createdById: 1 }) })
    )
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

describe('PUT /api/venues/:id', () => {
  beforeEach(() => jest.clearAllMocks())

  it('retourne 401 sans token', async () => {
    const res = await request(app).put('/api/venues/1').send({ name: 'Modifié' })
    expect(res.status).toBe(401)
  })

  it('modifie une venue et retourne 200', async () => {
    venueMock.update.mockResolvedValue({ ...fakeVenue, name: 'Modifié' })

    const res = await request(app)
      .put('/api/venues/1')
      .set('Authorization', authHeader())
      .send({ name: 'Modifié' })

    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Modifié')
  })

  it('retourne 404 si venue inexistante (P2025)', async () => {
    venueMock.update.mockRejectedValue({ code: 'P2025' })

    const res = await request(app)
      .put('/api/venues/999')
      .set('Authorization', authHeader())
      .send({ name: 'X' })

    expect(res.status).toBe(404)
  })

  it('retourne 400 si id non numérique', async () => {
    const res = await request(app)
      .put('/api/venues/abc')
      .set('Authorization', authHeader())
      .send({ name: 'X' })

    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/venues/:id', () => {
  beforeEach(() => jest.clearAllMocks())

  it('retourne 401 sans token', async () => {
    const res = await request(app).delete('/api/venues/1')
    expect(res.status).toBe(401)
  })

  it('supprime une venue et retourne 204', async () => {
    venueMock.delete.mockResolvedValue(fakeVenue)

    const res = await request(app)
      .delete('/api/venues/1')
      .set('Authorization', authHeader())

    expect(res.status).toBe(204)
  })

  it('retourne 404 si venue inexistante (P2025)', async () => {
    venueMock.delete.mockRejectedValue({ code: 'P2025' })

    const res = await request(app)
      .delete('/api/venues/999')
      .set('Authorization', authHeader())

    expect(res.status).toBe(404)
  })

  it('retourne 409 si venue a des concerts (P2003)', async () => {
    venueMock.delete.mockRejectedValue({ code: 'P2003' })

    const res = await request(app)
      .delete('/api/venues/1')
      .set('Authorization', authHeader())

    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/concerts/)
  })
})
