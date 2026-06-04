import request from 'supertest'
import jwt from 'jsonwebtoken'

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    show: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    ipBan: {
      findUnique: jest.fn().mockResolvedValue(null),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  },
}))

import prisma from '../../lib/prisma'
import { buildTestApp } from '../helpers/testApp'

const showMock = prisma.show as unknown as {
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

const fakeShow = {
  id: 1, label: 'Concert été', date: '2025-07-14T20:00:00.000Z', venueId: 1,
  venue: { id: 1, name: 'Le Zénith', city: 'Paris' },
}

describe('GET /api/shows', () => {
  beforeEach(() => jest.clearAllMocks())

  it('retourne la liste des shows (public, sans auth)', async () => {
    showMock.findMany.mockResolvedValue([fakeShow])

    const res = await request(app).get('/api/shows')

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0]).toMatchObject({ label: 'Concert été' })
  })

  it('inclut les données de venue', async () => {
    showMock.findMany.mockResolvedValue([fakeShow])

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
    expect(showMock.create).not.toHaveBeenCalled()
  })

  it('crée un show et retourne 201 avec token valide', async () => {
    showMock.create.mockResolvedValue({ id: 2, ...validPayload, createdById: 1 })

    const res = await request(app)
      .post('/api/shows')
      .set('Authorization', authHeader())
      .send(validPayload)

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ label: 'Nouveau concert' })
    expect(showMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ createdById: 1 }) })
    )
  })

  it('crée un show sans label (label optionnel)', async () => {
    const payload = { date: '2025-08-01T20:00:00.000Z', venueId: 1 }
    showMock.create.mockResolvedValue({ id: 3, label: null, ...payload })

    const res = await request(app)
      .post('/api/shows')
      .set('Authorization', authHeader())
      .send(payload)

    expect(res.status).toBe(201)
  })

  it('crée un show avec details', async () => {
    const payload = { ...validPayload, details: 'Portes à 19h' }
    showMock.create.mockResolvedValue({ id: 4, ...payload })

    const res = await request(app)
      .post('/api/shows')
      .set('Authorization', authHeader())
      .send(payload)

    expect(res.status).toBe(201)
  })

  it('retourne 400 si date invalide', async () => {
    const res = await request(app)
      .post('/api/shows')
      .set('Authorization', authHeader())
      .send({ label: 'Test', date: 'pas-une-date', venueId: 1 })

    expect(res.status).toBe(400)
  })
})

describe('PUT /api/shows/:id', () => {
  beforeEach(() => jest.clearAllMocks())

  it('retourne 401 sans token', async () => {
    const res = await request(app).put('/api/shows/1').send({ label: 'Modifié' })
    expect(res.status).toBe(401)
  })

  it('modifie un show et retourne 200', async () => {
    showMock.update.mockResolvedValue({ ...fakeShow, label: 'Modifié' })

    const res = await request(app)
      .put('/api/shows/1')
      .set('Authorization', authHeader())
      .send({ label: 'Modifié' })

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ label: 'Modifié' })
  })

  it('retourne 404 si show inexistant (P2025)', async () => {
    showMock.update.mockRejectedValue({ code: 'P2025' })

    const res = await request(app)
      .put('/api/shows/999')
      .set('Authorization', authHeader())
      .send({ label: 'X' })

    expect(res.status).toBe(404)
  })

  it('retourne 400 si id non numérique', async () => {
    const res = await request(app)
      .put('/api/shows/abc')
      .set('Authorization', authHeader())
      .send({ label: 'X' })

    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/shows/:id', () => {
  beforeEach(() => jest.clearAllMocks())

  it('retourne 401 sans token', async () => {
    const res = await request(app).delete('/api/shows/1')
    expect(res.status).toBe(401)
  })

  it('supprime un show et retourne 204', async () => {
    showMock.delete.mockResolvedValue(fakeShow)

    const res = await request(app)
      .delete('/api/shows/1')
      .set('Authorization', authHeader())

    expect(res.status).toBe(204)
  })

  it('retourne 404 si show inexistant (P2025)', async () => {
    showMock.delete.mockRejectedValue({ code: 'P2025' })

    const res = await request(app)
      .delete('/api/shows/999')
      .set('Authorization', authHeader())

    expect(res.status).toBe(404)
  })
})
