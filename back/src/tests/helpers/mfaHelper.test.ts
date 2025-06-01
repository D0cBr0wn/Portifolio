// src/tests/helpers/mfaTokenHelpers.test.ts
import jwt from 'jsonwebtoken'
import { createMfaTempToken } from '../../helpers/mfaHelper'

jest.mock('jsonwebtoken')

describe('createMfaTempToken', () => {
  const user = { id: 123, email: 'test@example.com' }

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.JWT_SECRET = 'test_secret'
  })

  afterAll(() => {
    delete process.env.JWT_SECRET
  })

  it('should use the mocked environment variable', () => {
    expect(process.env.JWT_SECRET).toBe('test_secret')
  })

  it('should call jwt.sign with correct payload and options', () => {
    const fakeToken = 'fake.jwt.token'
    ;(jwt.sign as jest.Mock).mockReturnValue(fakeToken)

    const token = createMfaTempToken(user as any)

    expect(jwt.sign).toHaveBeenCalledWith(
      { userId: user.id, email: user.email, type: 'mfa_temp' },
      'test_secret',
      { expiresIn: '2m' }
    )
    expect(token).toBe(fakeToken)
  })

  it('should fallback to default secret if process.env.JWT_SECRET is not set', () => {
    delete process.env.JWT_SECRET
    const fakeToken = 'fallback.jwt.token'
    ;(jwt.sign as jest.Mock).mockReturnValue(fakeToken)

    const token = createMfaTempToken(user as any)

    expect(jwt.sign).toHaveBeenCalledWith(
      expect.any(Object),
      'fallback_secret',
      expect.any(Object)
    )
    expect(token).toBe(fakeToken)
  })
})
