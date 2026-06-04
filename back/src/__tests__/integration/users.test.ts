import request from 'supertest'
import jwt from 'jsonwebtoken'

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn().mockResolvedValue(1),
    },
    ipBan: {
      findUnique: jest.fn().mockResolvedValue(null),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  },
}))

import prisma from '../../lib/prisma'
import { buildTestApp } from '../helpers/testApp'

const userMock = prisma.user as unknown as {
  findMany: jest.Mock
  findUnique: jest.Mock
  update: jest.Mock
  delete: jest.Mock
  count: jest.Mock
}
const app = buildTestApp()

const SECRET = 'test-secret-for-jest-at-least-32-chars'
process.env.JWT_SECRET = SECRET

function makeToken(userId: number, role: 'USER' | 'ADMIN') {
  return `Bearer ${jwt.sign({ userId, email: 'test@test.com', role }, SECRET, { expiresIn: '1h' })}`
}

const fakeUser = {
  id: 1,
  email: 'user@test.com',
  role: 'USER',
  mfaSecret: null,
  createdAt: new Date().toISOString(),
}

describe('GET /api/users', () => {
  beforeEach(() => jest.clearAllMocks())

  it('retourne 401 sans token', async () => {
    const res = await request(app).get('/api/users')
    expect(res.status).toBe(401)
  })

  it('retourne 403 si role USER', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', makeToken(1, 'USER'))
    expect(res.status).toBe(403)
  })

  it('retourne la liste si ADMIN', async () => {
    userMock.findMany.mockResolvedValue([fakeUser])

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', makeToken(1, 'ADMIN'))

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].mfaEnabled).toBe(false)
    expect(res.body[0].password).toBeUndefined()
    expect(res.body[0].mfaSecret).toBeUndefined()
  })
})

describe('GET /api/users/:id', () => {
  beforeEach(() => jest.clearAllMocks())

  it('retourne 401 sans token', async () => {
    const res = await request(app).get('/api/users/1')
    expect(res.status).toBe(401)
  })

  it('retourne 403 si USER accède à un autre compte', async () => {
    const res = await request(app)
      .get('/api/users/2')
      .set('Authorization', makeToken(1, 'USER'))
    expect(res.status).toBe(403)
  })

  it('retourne 200 si USER accède à son propre compte', async () => {
    userMock.findUnique.mockResolvedValue(fakeUser)

    const res = await request(app)
      .get('/api/users/1')
      .set('Authorization', makeToken(1, 'USER'))

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ id: 1, email: 'user@test.com' })
  })

  it('retourne 200 si ADMIN accède à n\'importe quel compte', async () => {
    userMock.findUnique.mockResolvedValue({ ...fakeUser, id: 2 })

    const res = await request(app)
      .get('/api/users/2')
      .set('Authorization', makeToken(1, 'ADMIN'))

    expect(res.status).toBe(200)
  })

  it('retourne 404 si utilisateur inexistant', async () => {
    userMock.findUnique.mockResolvedValue(null)

    const res = await request(app)
      .get('/api/users/999')
      .set('Authorization', makeToken(1, 'ADMIN'))

    expect(res.status).toBe(404)
  })
})

describe('PUT /api/users/:id', () => {
  beforeEach(() => jest.clearAllMocks())

  it('retourne 401 sans token', async () => {
    const res = await request(app).put('/api/users/1').send({ email: 'new@test.com' })
    expect(res.status).toBe(401)
  })

  it('retourne 403 si USER modifie un autre compte', async () => {
    const res = await request(app)
      .put('/api/users/2')
      .set('Authorization', makeToken(1, 'USER'))
      .send({ email: 'new@test.com' })
    expect(res.status).toBe(403)
  })

  it('retourne 400 si corps vide', async () => {
    const res = await request(app)
      .put('/api/users/1')
      .set('Authorization', makeToken(1, 'USER'))
      .send({})
    expect(res.status).toBe(400)
  })

  it('met à jour l\'email et retourne 200', async () => {
    userMock.update.mockResolvedValue({ ...fakeUser, email: 'new@test.com' })

    const res = await request(app)
      .put('/api/users/1')
      .set('Authorization', makeToken(1, 'USER'))
      .send({ email: 'new@test.com' })

    expect(res.status).toBe(200)
    expect(res.body.email).toBe('new@test.com')
  })

  it('hashe le password si fourni', async () => {
    userMock.update.mockResolvedValue(fakeUser)

    await request(app)
      .put('/api/users/1')
      .set('Authorization', makeToken(1, 'USER'))
      .send({ password: 'newpassword' })

    const callData = userMock.update.mock.calls[0][0].data
    expect(callData.password).toBeDefined()
    expect(callData.password).not.toBe('newpassword')
  })

  it('retourne 404 si utilisateur inexistant (P2025)', async () => {
    userMock.update.mockRejectedValue({ code: 'P2025' })

    const res = await request(app)
      .put('/api/users/999')
      .set('Authorization', makeToken(1, 'ADMIN'))
      .send({ email: 'new@test.com' })

    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/users/:id', () => {
  beforeEach(() => jest.clearAllMocks())

  it('retourne 401 sans token', async () => {
    const res = await request(app).delete('/api/users/1')
    expect(res.status).toBe(401)
  })

  it('retourne 403 si role USER', async () => {
    const res = await request(app)
      .delete('/api/users/1')
      .set('Authorization', makeToken(1, 'USER'))
    expect(res.status).toBe(403)
  })

  it('supprime l\'utilisateur et retourne 204 si ADMIN', async () => {
    userMock.delete.mockResolvedValue(fakeUser)

    const res = await request(app)
      .delete('/api/users/1')
      .set('Authorization', makeToken(1, 'ADMIN'))

    expect(res.status).toBe(204)
  })

  it('retourne 404 si utilisateur inexistant (P2025)', async () => {
    userMock.delete.mockRejectedValue({ code: 'P2025' })

    const res = await request(app)
      .delete('/api/users/999')
      .set('Authorization', makeToken(1, 'ADMIN'))

    expect(res.status).toBe(404)
  })
})

describe('GET /api/users/:id/mfa', () => {
  beforeEach(() => jest.clearAllMocks())

  it('retourne 401 sans token', async () => {
    const res = await request(app).get('/api/users/1/mfa')
    expect(res.status).toBe(401)
  })

  it('retourne { enabled: false } si MFA non configuré', async () => {
    userMock.findUnique.mockResolvedValue({ mfaSecret: null })

    const res = await request(app)
      .get('/api/users/1/mfa')
      .set('Authorization', makeToken(1, 'USER'))

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ enabled: false })
  })

  it('retourne { enabled: true } si MFA configuré', async () => {
    userMock.findUnique.mockResolvedValue({ mfaSecret: 'SOMESECRET' })

    const res = await request(app)
      .get('/api/users/1/mfa')
      .set('Authorization', makeToken(1, 'USER'))

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ enabled: true })
  })
})

describe('DELETE /api/users/:id/mfa', () => {
  beforeEach(() => jest.clearAllMocks())

  it('retourne 401 sans token', async () => {
    const res = await request(app).delete('/api/users/1/mfa')
    expect(res.status).toBe(401)
  })

  it('retourne 403 si USER accède à un autre compte', async () => {
    const res = await request(app)
      .delete('/api/users/2/mfa')
      .set('Authorization', makeToken(1, 'USER'))
    expect(res.status).toBe(403)
  })

  it('désactive le MFA et retourne 200', async () => {
    userMock.update.mockResolvedValue({ ...fakeUser, mfaSecret: null })

    const res = await request(app)
      .delete('/api/users/1/mfa')
      .set('Authorization', makeToken(1, 'USER'))

    expect(res.status).toBe(200)
    expect(userMock.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { mfaSecret: null } })
    )
  })
})
