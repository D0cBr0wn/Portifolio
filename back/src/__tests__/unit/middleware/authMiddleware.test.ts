import { authenticateToken } from '../../../middleware/authMiddleware'
import jwt from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'

jest.mock('jsonwebtoken')

const mockJwt = jwt as jest.Mocked<typeof jwt>

function makeReq(authHeader?: string): Partial<Request> {
  return { headers: { authorization: authHeader } }
}

function makeRes(): { status: jest.Mock; json: jest.Mock } {
  const json = jest.fn()
  const status = jest.fn().mockReturnValue({ json })
  return { status, json }
}

describe('authMiddleware — authenticateToken', () => {
  const next = jest.fn() as jest.MockedFunction<NextFunction>

  beforeEach(() => jest.clearAllMocks())

  it('appelle next() et set req.user si token valide', async () => {
    const payload = { userId: 1, email: 'user@test.com' }
    mockJwt.verify.mockReturnValue(payload as never)

    const req = makeReq('Bearer valid.token.here') as Request
    const res = makeRes() as unknown as Response

    await authenticateToken(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(req.user).toEqual(payload)
    expect(res.status).not.toHaveBeenCalled()
  })

  it('retourne 401 si aucun header Authorization', async () => {
    const req = makeReq() as Request
    const res = makeRes() as unknown as Response

    await authenticateToken(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('retourne 401 si header présent mais sans token (Bearer vide)', async () => {
    const req = makeReq('Bearer ') as Request
    const res = makeRes() as unknown as Response

    // jwt.verify sera appelé avec un token vide → exception
    mockJwt.verify.mockImplementation(() => { throw new Error('invalid') })

    await authenticateToken(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('retourne 403 si token invalide', async () => {
    mockJwt.verify.mockImplementation(() => { throw new Error('invalid signature') })

    const req = makeReq('Bearer bad.token') as Request
    const res = makeRes() as unknown as Response

    await authenticateToken(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('retourne 403 si token expiré', async () => {
    mockJwt.verify.mockImplementation(() => { throw new Error('jwt expired') })

    const req = makeReq('Bearer expired.token') as Request
    const res = makeRes() as unknown as Response

    await authenticateToken(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })
})
