jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    contactMessage: { findMany: jest.fn(), create: jest.fn() },
    ipBan: {
      findUnique: jest.fn().mockResolvedValue(null),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  },
}))

import request from 'supertest'
import jwt from 'jsonwebtoken'
import prisma from '../../lib/prisma'
import { buildTestApp } from '../helpers/testApp'

const contactMock = prisma.contactMessage as unknown as {
  findMany: jest.Mock
  create: jest.Mock
}
const app = buildTestApp()

const SECRET = 'test-secret-for-jest-at-least-32-chars'
process.env.JWT_SECRET = SECRET

function adminHeader() {
  return `Bearer ${jwt.sign({ userId: 1, email: 'admin@test.com', role: 'ADMIN' }, SECRET, { expiresIn: '1h' })}`
}

function userHeader() {
  return `Bearer ${jwt.sign({ userId: 2, email: 'user@test.com', role: 'USER' }, SECRET, { expiresIn: '1h' })}`
}

const validPayload = { name: 'Jean', email: 'jean@example.com', message: 'Bonjour!' }
const fakeMessage = { id: 1, ...validPayload, createdAt: new Date().toISOString() }

describe('POST /api/contact', () => {
  beforeEach(() => jest.clearAllMocks())

  it('retourne 201 avec un payload valide (sans auth)', async () => {
    contactMock.create.mockResolvedValue(fakeMessage)

    const res = await request(app).post('/api/contact').send(validPayload)

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ name: 'Jean', email: 'jean@example.com' })
    expect(contactMock.create).toHaveBeenCalledWith({ data: validPayload })
  })

  it('retourne 400 si name manquant', async () => {
    const res = await request(app).post('/api/contact').send({ email: 'jean@example.com', message: 'Bonjour!' })

    expect(res.status).toBe(400)
    expect(contactMock.create).not.toHaveBeenCalled()
  })

  it('retourne 400 si email invalide', async () => {
    const res = await request(app).post('/api/contact').send({ ...validPayload, email: 'pas-un-email' })

    expect(res.status).toBe(400)
    expect(contactMock.create).not.toHaveBeenCalled()
  })

  it('retourne 400 si message > 2000 caractères', async () => {
    const res = await request(app).post('/api/contact').send({ ...validPayload, message: 'x'.repeat(2001) })

    expect(res.status).toBe(400)
    expect(contactMock.create).not.toHaveBeenCalled()
  })

  it('retourne 400 si name > 100 caractères', async () => {
    const res = await request(app).post('/api/contact').send({ ...validPayload, name: 'n'.repeat(101) })

    expect(res.status).toBe(400)
    expect(contactMock.create).not.toHaveBeenCalled()
  })
})

describe('GET /api/contact', () => {
  beforeEach(() => jest.clearAllMocks())

  it('retourne 401 sans token', async () => {
    const res = await request(app).get('/api/contact')

    expect(res.status).toBe(401)
  })

  it('retourne 403 avec token USER (non admin)', async () => {
    const res = await request(app).get('/api/contact').set('Authorization', userHeader())

    expect(res.status).toBe(403)
  })

  it('retourne 200 avec liste triée par date desc (admin)', async () => {
    const messages = [
      { id: 2, name: 'Bob', email: 'bob@example.com', message: 'Later', createdAt: new Date('2025-02-01').toISOString() },
      { id: 1, name: 'Alice', email: 'alice@example.com', message: 'Earlier', createdAt: new Date('2025-01-01').toISOString() },
    ]
    contactMock.findMany.mockResolvedValue(messages)

    const res = await request(app).get('/api/contact').set('Authorization', adminHeader())

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
    expect(res.body[0].name).toBe('Bob')
    expect(contactMock.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: 'desc' } })
  })
})

describe('POST /api/contact — rate limit', () => {
  it('retourne 429 après dépassement du rate limit (20 req/10min)', async () => {
    // eslint-disable-next-line prefer-const
    let isolatedApp!: ReturnType<typeof buildTestApp>

    jest.isolateModules(() => {
      jest.mock('../../lib/prisma', () => ({
        __esModule: true,
        default: {
          contactMessage: { create: jest.fn().mockResolvedValue(fakeMessage) },
          ipBan: {
            findUnique: jest.fn().mockResolvedValue(null),
            deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
        },
      }))
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { buildTestApp: buildIsolated } = require('../helpers/testApp')
      isolatedApp = buildIsolated()
    })

    const valid = { name: 'Jean', email: 'jean@example.com', message: 'Bonjour!' }
    for (let i = 0; i < 20; i++) {
      await request(isolatedApp).post('/api/contact').send(valid)
    }
    const res = await request(isolatedApp).post('/api/contact').send(valid)

    expect(res.status).toBe(429)
  }, 30000)
})
