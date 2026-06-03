import request from 'supertest'

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    failedLoginAttempt: {
      create: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    ipBan: {
      upsert: jest.fn(),
      findUnique: jest.fn().mockResolvedValue(null),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  },
}))

jest.mock('../../utils/sendAlerts', () => ({ sendAdminBanAlert: jest.fn() }))

jest.mock('../../middleware/rateLimiterMiddleware', () => ({
  loginLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
}))

import prisma from '../../lib/prisma'
import { buildTestApp } from '../helpers/testApp'

const userMock = prisma.user as unknown as { create: jest.Mock; findUnique: jest.Mock; update: jest.Mock }
const app = buildTestApp()

process.env.JWT_SECRET = 'test-secret-for-jest-at-least-32-chars'

describe('POST /api/auth/register', () => {
  beforeEach(() => jest.clearAllMocks())

  it('crée un utilisateur et retourne 201', async () => {
    userMock.create.mockResolvedValue({ id: 1, email: 'new@test.com', password: 'hash', mfaSecret: null, banUntil: null })

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new@test.com', password: 'password123' })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ id: 1, email: 'new@test.com' })
    expect(res.body.password).toBeUndefined()
  })

  it('retourne 400 si email invalide', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'password123' })

    expect(res.status).toBe(400)
    expect(userMock.create).not.toHaveBeenCalled()
  })

  it('retourne 400 si mot de passe trop court', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'user@test.com', password: '123' })

    expect(res.status).toBe(400)
  })

  it('retourne 400 (message générique) si email déjà utilisé', async () => {
    userMock.create.mockRejectedValue(new Error('Unique constraint'))

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'exists@test.com', password: 'password123' })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Identifiants invalides')
  })
})

describe('POST /api/auth/login', () => {
  beforeEach(() => jest.clearAllMocks())

  it('retourne un token JWT si credentials corrects sans MFA', async () => {
    const bcrypt = await import('bcryptjs')
    const hash = await bcrypt.hash('password123', 1)

    userMock.findUnique.mockResolvedValue({
      id: 1, email: 'user@test.com', password: hash, mfaSecret: null, banUntil: null,
    })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'password123' })

    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
  })

  it('retourne 206 + mfaRequired si MFA activé', async () => {
    const bcrypt = await import('bcryptjs')
    const hash = await bcrypt.hash('password123', 1)

    userMock.findUnique.mockResolvedValue({
      id: 1, email: 'user@test.com', password: hash, mfaSecret: 'JBSWY3DPEHPK3PXP', banUntil: null,
    })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'password123' })

    expect(res.status).toBe(206)
    expect(res.body.mfaRequired).toBe(true)
    expect(res.body.userId).toBe(1)
    expect(res.body.token).toBeUndefined()
  })

  it('retourne 401 avec message générique si mot de passe incorrect', async () => {
    const bcrypt = await import('bcryptjs')
    const hash = await bcrypt.hash('correct', 1)

    userMock.findUnique.mockResolvedValue({
      id: 1, email: 'user@test.com', password: hash, mfaSecret: null, banUntil: null,
    })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'wrong-password' })

    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Identifiants invalides')
  })

  it('retourne 401 avec message générique si utilisateur inconnu', async () => {
    userMock.findUnique.mockResolvedValue(null)

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'password123' })

    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Identifiants invalides')
  })

  it('retourne 403 si email contient "admin"', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' })

    expect(res.status).toBe(403)
    expect(res.body.error).toBe('Identifiants invalides')
  })

  it('retourne 403 si compte banni', async () => {
    const bcrypt = await import('bcryptjs')
    const hash = await bcrypt.hash('password123', 1)

    userMock.findUnique.mockResolvedValue({
      id: 1, email: 'user@test.com', password: hash, mfaSecret: null,
      banUntil: new Date(Date.now() + 3_600_000),
    })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'password123' })

    expect(res.status).toBe(403)
    expect(res.body.error).toBe('Identifiants invalides')
  })
})
