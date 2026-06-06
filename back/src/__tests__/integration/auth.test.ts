import request from 'supertest'

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn().mockResolvedValue(1),
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

const userMock = prisma.user as unknown as { create: jest.Mock; findUnique: jest.Mock; update: jest.Mock; count: jest.Mock }
const app = buildTestApp()

process.env.JWT_SECRET = 'test-secret-for-jest-at-least-32-chars'

describe('POST /api/auth/register', () => {
  beforeEach(() => jest.clearAllMocks())

  it('crée un utilisateur et retourne 201', async () => {
    userMock.create.mockResolvedValue({ id: 1, email: 'new@test.com', password: 'hash', role: 'USER', mfaSecret: null, banUntil: null })

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

  it('ignore isAdmin=true et crée un USER', async () => {
    userMock.create.mockResolvedValue({ id: 2, email: 'user2@test.com', password: 'hash', role: 'USER', mfaSecret: null, banUntil: null })
    userMock.count.mockResolvedValue(1)

    await request(app)
      .post('/api/auth/register')
      .send({ email: 'user2@test.com', password: 'password123', isAdmin: true })

    expect(userMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ role: 'USER' }) })
    )
  })
})

describe('POST /api/auth/login', () => {
  beforeEach(() => jest.clearAllMocks())

  it('retourne un token JWT si credentials corrects sans MFA', async () => {
    const bcrypt = await import('bcryptjs')
    const hash = await bcrypt.hash('password123', 1)

    userMock.findUnique.mockResolvedValue({
      id: 1, email: 'user@test.com', password: hash, role: 'USER', mfaSecret: null, banUntil: null,
    })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'password123' })

    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()

    const jwt = await import('jsonwebtoken')
    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET!) as { userId: number; role: string }
    expect(decoded.role).toBe('USER')
  })

  it('retourne 206 + mfaRequired si MFA activé', async () => {
    const bcrypt = await import('bcryptjs')
    const hash = await bcrypt.hash('password123', 1)

    userMock.findUnique.mockResolvedValue({
      id: 1, email: 'user@test.com', password: hash, role: 'USER', mfaSecret: 'JBSWY3DPEHPK3PXP', banUntil: null,
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
      id: 1, email: 'user@test.com', password: hash, role: 'USER', mfaSecret: null, banUntil: null,
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
      id: 1, email: 'user@test.com', password: hash, role: 'USER', mfaSecret: null,
      banUntil: new Date(Date.now() + 3_600_000),
    })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'password123' })

    expect(res.status).toBe(403)
    expect(res.body.error).toBe('Identifiants invalides')
  })

  it('retourne 206 + mfaSetupRequired si mfaRequired=true et mfaSecret=null', async () => {
    const bcrypt = await import('bcryptjs')
    const hash = await bcrypt.hash('password123', 1)

    userMock.findUnique.mockResolvedValue({
      id: 1, email: 'user@test.com', password: hash, role: 'USER',
      mfaRequired: true, mfaSecret: null, banUntil: null,
    })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'password123' })

    expect(res.status).toBe(206)
    expect(res.body.mfaSetupRequired).toBe(true)
    expect(res.body.userId).toBe(1)
    expect(res.body.setupToken).toBeDefined()

    const jwt = await import('jsonwebtoken')
    const decoded = jwt.verify(res.body.setupToken, process.env.JWT_SECRET!) as { scope: string }
    expect(decoded.scope).toBe('mfa-setup')
  })
})
