import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('../../services/userService', () => ({
  userService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    updateRole: vi.fn(),
    updatePassword: vi.fn(),
    requireMfa: vi.fn(),
    disableMfa: vi.fn(),
    remove: vi.fn(),
  },
}))

vi.mock('../../stores/authStore', () => ({
  useAuthStore: () => ({ token: 'fake-token' }),
}))

import { useUserStore } from '../../stores/userStore'
import { userService } from '../../services/userService'

const mockService = userService as {
  getAll: ReturnType<typeof vi.fn>
  getById: ReturnType<typeof vi.fn>
  updateRole: ReturnType<typeof vi.fn>
  updatePassword: ReturnType<typeof vi.fn>
  requireMfa: ReturnType<typeof vi.fn>
  disableMfa: ReturnType<typeof vi.fn>
  remove: ReturnType<typeof vi.fn>
}

const fakeUser = { id: 1, email: 'user@test.com', role: 'USER' as const, mfaEnabled: false, createdAt: '2025-01-01' }

describe('userStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('loadUser() charge currentUser', async () => {
    mockService.getById.mockResolvedValue(fakeUser)
    const store = useUserStore()
    await store.loadUser(1)
    expect(store.currentUser).toEqual(fakeUser)
    expect(store.error).toBeNull()
  })

  it('updateRole() met à jour currentUser et users[]', async () => {
    const updated = { ...fakeUser, role: 'ADMIN' as const }
    mockService.updateRole.mockResolvedValue(updated)

    const store = useUserStore()
    store.users = [fakeUser]
    store.currentUser = fakeUser
    await store.updateRole(1, 'ADMIN')

    expect(store.currentUser?.role).toBe('ADMIN')
    expect(store.users[0].role).toBe('ADMIN')
  })

  it('updatePassword() appelle le service et ne lève pas d\'erreur', async () => {
    mockService.updatePassword.mockResolvedValue(fakeUser)
    const store = useUserStore()
    await store.updatePassword(1, 'newpassword')
    expect(mockService.updatePassword).toHaveBeenCalledWith(1, 'newpassword')
    expect(store.error).toBeNull()
  })

  it('requireMfa() met mfaEnabled à false dans users[] et currentUser', async () => {
    mockService.requireMfa.mockResolvedValue(undefined)
    const store = useUserStore()
    store.users = [{ ...fakeUser, mfaEnabled: true }]
    store.currentUser = { ...fakeUser, mfaEnabled: true }
    await store.requireMfa(1)
    expect(store.users[0].mfaEnabled).toBe(false)
    expect(store.currentUser?.mfaEnabled).toBe(false)
  })

  it('disableMfa() met mfaEnabled à false dans users[] et currentUser', async () => {
    mockService.disableMfa.mockResolvedValue(undefined)
    const store = useUserStore()
    store.users = [{ ...fakeUser, mfaEnabled: true }]
    store.currentUser = { ...fakeUser, mfaEnabled: true }
    await store.disableMfa(1)
    expect(store.users[0].mfaEnabled).toBe(false)
    expect(store.currentUser?.mfaEnabled).toBe(false)
  })

  it('remove() retire l\'user de users[]', async () => {
    mockService.remove.mockResolvedValue(undefined)
    const store = useUserStore()
    store.users = [fakeUser]
    await store.remove(1)
    expect(store.users).toHaveLength(0)
  })
})
