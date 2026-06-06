import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authService } from '../../services/authService'

vi.mock('../../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    postAs: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

import { api } from '../../services/api'
const mockApi = api as { post: ReturnType<typeof vi.fn>; postAs: ReturnType<typeof vi.fn> }

describe('authService', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('login()', () => {
    it('envoie les identifiants et retourne une AuthResponse', async () => {
      const resp = { token: 'tok123' }
      mockApi.post.mockResolvedValue(resp)
      const result = await authService.login('a@b.com', 'secret')
      expect(result).toEqual(resp)
      expect(mockApi.post).toHaveBeenCalledWith('/auth/login', { email: 'a@b.com', password: 'secret' })
    })

    it('retourne mfaRequired=true quand le MFA est requis', async () => {
      const resp = { mfaRequired: true, userId: 42 }
      mockApi.post.mockResolvedValue(resp)
      const result = await authService.login('a@b.com', 'secret')
      expect(result.mfaRequired).toBe(true)
      expect(result.userId).toBe(42)
    })
  })

  describe('verifyMfa()', () => {
    it('envoie pendingToken + code et retourne MfaVerifyResponse', async () => {
      const resp = { verified: true, token: 'mfa-tok' }
      mockApi.postAs.mockResolvedValue(resp)
      const result = await authService.verifyMfa('pending-jwt', '123456')
      expect(result.verified).toBe(true)
      expect(mockApi.postAs).toHaveBeenCalledWith('/mfa/login', { token: '123456' }, 'pending-jwt')
    })
  })

  describe('register()', () => {
    it('envoie email + password et retourne le nouvel utilisateur', async () => {
      const resp = { id: 1, email: 'a@b.com' }
      mockApi.post.mockResolvedValue(resp)
      const result = await authService.register('a@b.com', 'pass123')
      expect(result.id).toBe(1)
      expect(mockApi.post).toHaveBeenCalledWith('/auth/register', { email: 'a@b.com', password: 'pass123', isAdmin: false })
    })
  })

  describe('setupMfaWithToken()', () => {
    it('appelle postAs avec le setup token', async () => {
      const resp = { qrCodeDataURL: 'data:image/png', secret: 'SEC' }
      mockApi.postAs.mockResolvedValue(resp)
      const result = await authService.setupMfaWithToken('setup-tok')
      expect(result.secret).toBe('SEC')
      expect(mockApi.postAs).toHaveBeenCalledWith('/mfa/setup', {}, 'setup-tok')
    })
  })
})
