import request from 'supertest'
import jwt from 'jsonwebtoken'

jest.mock('../../lib/prisma', () => ({
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
    otpauth_url: 'otpauth://totp/Auboulot%20(test%40test.com)?secret=JBSWY3DPEHPK3PXP',
  }),
  totp: {
    verify: jest.fn(),
  },
}))

jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,fake'),
}))

import prisma from '../../lib/prisma'
import speakeasy from 'speakeasy'
import { buildTestApp } from '../helpers/testApp'

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockSpeakeasy = speakeasy as jest.Mocked<typeof speakeasy>
const app = buildTestApp()

const SECRET = 'test-secret-for-jest-at-least-32-chars'
process.env.JWT_SECRET = SECRET

function makeToken(userId: number, email: string) {
  return jwt.sign({ userId, email }, SECRET, { expiresIn: '1h' })
}

describe('POST /api/mfa/setup', () => {
  beforeEach(() => jest.clearAllMocks())

  it('retourne 401 sans token', async () => {
    const res = await request(app).post('/api/mfa/setup')
    expect(res.status).toBe(401)
  })

  it('retourne le QR code et le secret avec un token valide', async () => {
    mockPrisma.user.update.mockResolvedValue({} as never)

    const token = makeToken(1, 'test@test.com')
    const res = await request(app)
      .post('/api/mfa/setup')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.qrCodeDataURL).toBe('data:image/png;base64,fake')
    expect(res.body.secret).toBe('JBSWY3DPEHPK3PXP')
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
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
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 1, email: 'test@test.com', password: '', mfaSecret: null, banUntil: null,
    })

    const token = makeToken(1, 'test@test.com')
    const res = await request(app)
      .post('/api/mfa/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ token: '123456' })

    expect(res.status).toBe(400)
  })

  it('retourne 401 si code TOTP invalide', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 1, email: 'test@test.com', password: '', mfaSecret: 'JBSWY3DPEHPK3PXP', banUntil: null,
    })
    mockSpeakeasy.totp.verify.mockReturnValue(false)

    const token = makeToken(1, 'test@test.com')
    const res = await request(app)
      .post('/api/mfa/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ token: '000000' })

    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Identifiants invalides')
  })

  it('retourne un JWT final si code TOTP valide', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 1, email: 'test@test.com', password: '', mfaSecret: 'JBSWY3DPEHPK3PXP', banUntil: null,
    })
    mockSpeakeasy.totp.verify.mockReturnValue(true)

    const token = makeToken(1, 'test@test.com')
    const res = await request(app)
      .post('/api/mfa/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ token: '123456' })

    expect(res.status).toBe(200)
    expect(res.body.verified).toBe(true)
    expect(res.body.token).toBeDefined()

    const decoded = jwt.verify(res.body.token, SECRET) as { userId: number; email: string }
    expect(decoded.userId).toBe(1)
    expect(decoded.email).toBe('test@test.com')
  })
})
