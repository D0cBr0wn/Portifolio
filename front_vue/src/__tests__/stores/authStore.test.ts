import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../../stores/authStore'

describe('authStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    sessionStorage.clear()
  })

  it('isAuthenticated est false sans token', () => {
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(false)
    expect(store.token).toBeNull()
  })

  it('setToken stocke le token en mémoire et en sessionStorage', () => {
    const store = useAuthStore()
    store.setToken('mon-jwt')

    expect(store.token).toBe('mon-jwt')
    expect(store.isAuthenticated).toBe(true)
    expect(sessionStorage.getItem('token')).toBe('mon-jwt')
  })

  it('logout supprime le token de la mémoire et du sessionStorage', () => {
    const store = useAuthStore()
    store.setToken('mon-jwt')
    store.logout()

    expect(store.token).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(sessionStorage.getItem('token')).toBeNull()
  })

  it('isAuthenticated est true si un token existe déjà en sessionStorage', () => {
    sessionStorage.setItem('token', 'token-existant')
    const store = useAuthStore()

    expect(store.isAuthenticated).toBe(true)
    expect(store.token).toBe('token-existant')
  })
})
