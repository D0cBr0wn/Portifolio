import { authenticateToken } from '../../middleware/authMiddleware'
import jwt from 'jsonwebtoken'

jest.mock('jsonwebtoken')

describe('authenticateToken middleware', () => {
  let req: any
  let res: any
  let next: jest.Mock
  const SECRET = process.env.JWT_SECRET ?? 'fallback_secret'

  beforeEach(() => {
    req = {
      headers: {}
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    next = jest.fn()
    jest.clearAllMocks()
  })

  it('should return 401 if no token provided', async () => {
    req.headers['authorization'] = undefined

    await authenticateToken(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' })
    expect(next).not.toHaveBeenCalled()
  })

  it('should return 403 if token is invalid', async () => {
    req.headers['authorization'] = 'Bearer invalidtoken'
    ;(jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token')
    })

    await authenticateToken(req, res, next)

    expect(jwt.verify).toHaveBeenCalledWith('invalidtoken', SECRET)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' })
    expect(next).not.toHaveBeenCalled()
  })

  it('should call next and attach user if token is valid', async () => {
    const payload = { userId: 1, email: 'test@example.com' }
    req.headers['authorization'] = 'Bearer validtoken'
    ;(jwt.verify as jest.Mock).mockReturnValue(payload)

    await authenticateToken(req, res, next)

    expect(jwt.verify).toHaveBeenCalledWith('validtoken', SECRET)
    expect(req.user).toEqual(payload)
    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
  })
})
