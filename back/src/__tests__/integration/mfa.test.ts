import request from 'supertest'
import jwt from 'jsonwebtoken'

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    user: { findUnique: jest.fn(), update: jest.fn() },
    ipBan: {
      findUnique: jest.fn().mockResolvedValue(null),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  },
}))

jest.mock('speakeasy', () => ({
  generateSecret: jest.fn().mockReturnValue({
    base32: 'JBSWY3DPEHPK3PXP',
    otpauth_url: 'otpauth://totp/test',
  }),
  totp: { verify: jest.fn() },
}))

jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,fake'),
}))

import prisma from '../../lib/prisma'
import { buildTestApp } from '../helpers/testApp'

const userMock = prisma.user as unknown as { findUnique: jest.Mock; update: jest.Mock }
const speakeasy = require('speakeasy')
const app = buildTestApp()

const SECRET = 'test-secret-for-jest-at-least-32-chars'
process.env.JWT_SECRET = SECRET

function makeToken(userId: number, email: string, role: 'USER' | 'ADMIN' = 'USER', scope?: 'mfa-setup' | 'mfa-pending') {
  return jwt.sign({ userId, email, role, ...(scope ? { scope } : {}) }, SECRET, { expiresIn: '1h' })
}

describe('POST /api/mfa/login', () => {
  beforeEach(() => jest.clearAllMocks())

  it('retourne 401 sans Bearer token', async () => {
    const res = await request(app).post('/api/mfa/login').send({ token: '123456' })
    expect(res.status).toBe(401)
  })

  it('retourne 403 si scope != mfa-pending', async () => {
    const wrongToken = makeToken(1, 'test@test.com')
    const res = await request(app)
      .post('/api/mfa/login')
      .set('Authorization', `Bearer ${wrongToken}`)
      .send({ token: '123456' })
    expect(res.status).toBe(403)
  })

  it('retourne 400 si MFA non configuré pour l\'utilisateur', async () => {
    userMock.findUnique.mockResolvedValue({
      id: 1, email: 'test@test.com', password: '', role: 'USER', mfaSecret: null, banUntil: null,
    })
    const pendingToken = makeToken(1, 'test@test.com', 'USER', 'mfa-pending')
    const res = await request(app)
      .post('/api/mfa/login')
      .set('Authorization', `Bearer ${pendingToken}`)
      .send({ token: '123456' })
    expect(res.status).toBe(400)
  })

  it('retourne 401 si code TOTP invalide', async () => {
    userMock.findUnique.mockResolvedValue({
      id: 1, email: 'test@test.com', password: '', role: 'USER', mfaSecret: 'JBSWY3DPEHPK3PXP', banUntil: null,
    })
    speakeasy.totp.verify.mockReturnValue(false)
    const pendingToken = makeToken(1, 'test@test.com', 'USER', 'mfa-pending')
    const res = await request(app)
      .post('/api/mfa/login')
      .set('Authorization', `Bearer ${pendingToken}`)
      .send({ token: '000000' })
    expect(res.status).toBe(401)
  })

  it('retourne un JWT final si code TOTP valide', async () => {
    userMock.findUnique.mockResolvedValue({
      id: 1, email: 'test@test.com', password: '', role: 'USER', mfaSecret: 'JBSWY3DPEHPK3PXP', banUntil: null,
    })
    speakeasy.totp.verify.mockReturnValue(true)
    const pendingToken = makeToken(1, 'test@test.com', 'USER', 'mfa-pending')
    const res = await request(app)
      .post('/api/mfa/login')
      .set('Authorization', `Bearer ${pendingToken}`)
      .send({ token: '123456' })
    expect(res.status).toBe(200)
    expect(res.body.verified).toBe(true)
    expect(res.body.token).toBeDefined()
    const decoded = jwt.verify(res.body.token, SECRET) as { userId: number; email: string; role: string }
    expect(decoded.userId).toBe(1)
    expect(decoded.email).toBe('test@test.com')
    expect(decoded.role).toBe('USER')
  })
})

describe('POST /api/mfa/setup', () => {
  beforeEach(() => jest.clearAllMocks())

  it('retourne 401 sans token', async () => {
    const res = await request(app).post('/api/mfa/setup')
    expect(res.status).toBe(401)
  })

  it('retourne le QR code et le secret avec un token valide', async () => {
    userMock.update.mockResolvedValue({})

    const token = makeToken(1, 'test@test.com')
    const res = await request(app)
      .post('/api/mfa/setup')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.qrCodeDataURL).toBe('data:image/png;base64,fake')
    expect(res.body.secret).toBe('JBSWY3DPEHPK3PXP')
    expect(userMock.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { mfaSecret: 'JBSWY3DPEHPK3PXP' } })
    )
  })
})

describe('POST /api/mfa/verify', () => {
  beforeEach(() => jest.clearAllMocks())

  it('retourne 401 sans token', async () => {
    const res = await request(app).post('/api/mfa/verify').send({ token: '123456' })
    expect(res.status).toBe(401)
  })

  it('retourne 400 si MFA non configuré pour l\'utilisateur', async () => {
    userMock.findUnique.mockResolvedValue({
      id: 1, email: 'test@test.com', password: '', role: 'USER', mfaSecret: null, banUntil: null,
    })

    const token = makeToken(1, 'test@test.com')
    const res = await request(app)
      .post('/api/mfa/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ token: '123456' })

    expect(res.status).toBe(400)
  })

  it('retourne 401 si code TOTP invalide', async () => {
    userMock.findUnique.mockResolvedValue({
      id: 1, email: 'test@test.com', password: '', role: 'USER', mfaSecret: 'JBSWY3DPEHPK3PXP', banUntil: null,
    })
    speakeasy.totp.verify.mockReturnValue(false)

    const token = makeToken(1, 'test@test.com')
    const res = await request(app)
      .post('/api/mfa/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ token: '000000' })

    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Identifiants invalides')
  })

  it('retourne un JWT final si code TOTP valide', async () => {
    userMock.findUnique.mockResolvedValue({
      id: 1, email: 'test@test.com', password: '', role: 'USER', mfaSecret: 'JBSWY3DPEHPK3PXP', banUntil: null,
    })
    speakeasy.totp.verify.mockReturnValue(true)

    const token = makeToken(1, 'test@test.com')
    const res = await request(app)
      .post('/api/mfa/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ token: '123456' })

    expect(res.status).toBe(200)
    expect(res.body.verified).toBe(true)
    expect(res.body.token).toBeDefined()

    const decoded = jwt.verify(res.body.token, SECRET) as { userId: number; email: string; role: string }
    expect(decoded.userId).toBe(1)
    expect(decoded.email).toBe('test@test.com')
    expect(decoded.role).toBe('USER')
  })

  it('met mfaRequired à false et retourne JWT final si scope=mfa-setup', async () => {
    userMock.findUnique.mockResolvedValue({
      id: 1, email: 'test@test.com', password: '', role: 'USER', mfaSecret: 'JBSWY3DPEHPK3PXP', banUntil: null,
    })
    userMock.update.mockResolvedValue({})
    speakeasy.totp.verify.mockReturnValue(true)

    const setupToken = makeToken(1, 'test@test.com', 'USER', 'mfa-setup')
    const res = await request(app)
      .post('/api/mfa/verify')
      .set('Authorization', `Bearer ${setupToken}`)
      .send({ token: '123456' })

    expect(res.status).toBe(200)
    expect(res.body.verified).toBe(true)
    expect(res.body.token).toBeDefined()
    expect(userMock.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { mfaRequired: false } })
    )
  })
})
