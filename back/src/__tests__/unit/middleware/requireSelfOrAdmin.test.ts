import { requireSelfOrAdmin } from '../../../middleware/requireSelfOrAdmin'
import type { Request, Response, NextFunction } from 'express'

function makeReq(id: string, user?: { userId: number; email: string; role: 'USER' | 'ADMIN' }): Partial<Request> {
  return { params: { id }, user }
}

function makeRes(): { status: jest.Mock; json: jest.Mock } {
  const json = jest.fn()
  const status = jest.fn().mockReturnValue({ json })
  return { status, json }
}

describe('requireSelfOrAdmin', () => {
  const next = jest.fn() as jest.MockedFunction<NextFunction>

  beforeEach(() => jest.clearAllMocks())

  it('appelle next() si ADMIN', () => {
    const req = makeReq('2', { userId: 1, email: 'admin@test.com', role: 'ADMIN' }) as Request
    const res = makeRes() as unknown as Response

    requireSelfOrAdmin(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(res.status).not.toHaveBeenCalled()
  })

  it('appelle next() si self (USER accède à son propre ID)', () => {
    const req = makeReq('1', { userId: 1, email: 'user@test.com', role: 'USER' }) as Request
    const res = makeRes() as unknown as Response

    requireSelfOrAdmin(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(res.status).not.toHaveBeenCalled()
  })

  it('retourne 403 si USER accède à un autre ID', () => {
    const req = makeReq('2', { userId: 1, email: 'user@test.com', role: 'USER' }) as Request
    const res = makeRes() as unknown as Response

    requireSelfOrAdmin(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('retourne 403 si non authentifié', () => {
    const req = makeReq('1') as Request
    const res = makeRes() as unknown as Response

    requireSelfOrAdmin(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('retourne 400 si id non numérique', () => {
    const req = makeReq('abc', { userId: 1, email: 'user@test.com', role: 'USER' }) as Request
    const res = makeRes() as unknown as Response

    requireSelfOrAdmin(req, res, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(next).not.toHaveBeenCalled()
  })
})
