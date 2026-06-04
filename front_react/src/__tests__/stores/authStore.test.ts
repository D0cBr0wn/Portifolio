import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useAuthStore } from '../../stores/authStore'

const INITIAL: Parameters<typeof useAuthStore.setState>[0] = {
  token: null,
  isAuthenticated: false,
  isAdmin: false,
}

const ADMIN_TOKEN = 'header.' + btoa(JSON.stringify({ role: 'ADMIN' })) + '.sig'
const USER_TOKEN  = 'header.' + btoa(JSON.stringify({ role: 'USER'  })) + '.sig'

describe('authStore', () => {
  beforeEach(() => {
    sessionStorage.clear()
    useAuthStore.setState(INITIAL)
  })
  afterEach(() => vi.clearAllMocks())

  describe('état initial', () => {
    it('token null, non authentifié, non admin', () => {
      const s = useAuthStore.getState()
      expect(s.token).toBeNull()
      expect(s.isAuthenticated).toBe(false)
      expect(s.isAdmin).toBe(false)
    })
  })

  describe('setToken()', () => {
    it('définit le token et passe isAuthenticated à true', () => {
      useAuthStore.getState().setToken(USER_TOKEN)
      const s = useAuthStore.getState()
      expect(s.token).toBe(USER_TOKEN)
      expect(s.isAuthenticated).toBe(true)
    })

    it('détecte le rôle ADMIN depuis le JWT', () => {
      useAuthStore.getState().setToken(ADMIN_TOKEN)
      expect(useAuthStore.getState().isAdmin).toBe(true)
    })

    it('isAdmin reste false pour un USER', () => {
      useAuthStore.getState().setToken(USER_TOKEN)
      expect(useAuthStore.getState().isAdmin).toBe(false)
    })

    it('sauvegarde le token dans sessionStorage', () => {
      useAuthStore.getState().setToken(USER_TOKEN)
      expect(sessionStorage.getItem('token')).toBe(USER_TOKEN)
    })
  })

  describe('logout()', () => {
    it('réinitialise l\'état et vide sessionStorage', () => {
      useAuthStore.getState().setToken(USER_TOKEN)
      useAuthStore.getState().logout()
      const s = useAuthStore.getState()
      expect(s.token).toBeNull()
      expect(s.isAuthenticated).toBe(false)
      expect(sessionStorage.getItem('token')).toBeNull()
    })
  })
})
