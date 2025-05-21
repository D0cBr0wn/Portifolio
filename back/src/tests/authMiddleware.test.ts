import { authenticateToken } from '../middleware/authMiddleware'
import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'

jest.mock('jsonwebtoken')

describe('authenticateToken middleware', () => {
  const SECRET = process.env.JWT_SECRET ?? 'fallback_secret'

  let req: Partial<Request>
  let res: Partial<Response>
  let next: NextFunction

  beforeEach(() => {
    req = {
      headers: {}
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    next = jest.fn()
  })

  it('should return 401 if no token provided', async () => {
    req.headers = {}
    await authenticateToken(req as Request, res as Response, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' })
    expect(next).not.toHaveBeenCalled()
  })

  it('should return 403 if token is invalid', async () => {
    req.headers = { authorization: 'Bearer badtoken' }
    // @ts-ignore
    jwt.verify.mockImplementation(() => {
      throw new Error('invalid')
    })
    await authenticateToken(req as Request, res as Response, next)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' })
    expect(next).not.toHaveBeenCalled()
  })

  it('should call next and attach user if token is valid', async () => {
    const payload = { id: 1, email: 'test@test.com' }
    req.headers = { authorization: 'Bearer goodtoken' }
    // @ts-ignore
    jwt.verify.mockReturnValue(payload)

    await authenticateToken(req as Request, res as Response, next)

    expect(next).toHaveBeenCalled()
    // @ts-ignore
    expect(req.user).toEqual(payload)
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
  })
})
