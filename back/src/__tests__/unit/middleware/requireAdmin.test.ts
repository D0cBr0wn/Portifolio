import { requireAdmin } from '../../../middleware/requireAdmin'
import type { Request, Response, NextFunction } from 'express'

function makeReq(role?: 'USER' | 'ADMIN'): Partial<Request> {
  return role ? { user: { userId: 1, email: 'test@test.com', role } } : {}
}

function makeRes(): { status: jest.Mock; json: jest.Mock } {
  const json = jest.fn()
  const status = jest.fn().mockReturnValue({ json })
  return { status, json }
}

describe('requireAdmin', () => {
  const next = jest.fn() as jest.MockedFunction<NextFunction>

  beforeEach(() => jest.clearAllMocks())

  it('appelle next() si role ADMIN', () => {
    const req = makeReq('ADMIN') as Request
    const res = makeRes() as unknown as Response

    requireAdmin(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(res.status).not.toHaveBeenCalled()
  })

  it('retourne 403 si role USER', () => {
    const req = makeReq('USER') as Request
    const res = makeRes() as unknown as Response

    requireAdmin(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('retourne 403 si non authentifié (req.user absent)', () => {
    const req = makeReq() as Request
    const res = makeRes() as unknown as Response

    requireAdmin(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })
})
