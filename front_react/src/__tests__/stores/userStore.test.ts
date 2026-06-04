import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useUserStore } from '../../stores/userStore'
import type { UserData } from '@portfolio/shared'

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

import { userService } from '../../services/userService'
const mock = userService as { [k: string]: ReturnType<typeof vi.fn> }

const INITIAL = { users: [], currentUser: null, loading: false, error: null }
const makeUser = (id: number, role: 'USER' | 'ADMIN' = 'USER'): UserData => ({
  id, email: `user${id}@test.com`, role, mfaEnabled: false, createdAt: '2025-01-01',
})

describe('userStore', () => {
  beforeEach(() => {
    useUserStore.setState(INITIAL)
    vi.clearAllMocks()
  })

  describe('load()', () => {
    it('charge les utilisateurs', async () => {
      mock.getAll.mockResolvedValue([makeUser(1)])
      await useUserStore.getState().load()
      expect(useUserStore.getState().users).toHaveLength(1)
      expect(useUserStore.getState().loading).toBe(false)
    })

    it('définit error en cas d\'échec', async () => {
      mock.getAll.mockRejectedValue(new Error('fail'))
      await useUserStore.getState().load()
      expect(useUserStore.getState().error).toBeTruthy()
    })
  })

  describe('loadUser()', () => {
    it('charge un utilisateur dans currentUser', async () => {
      mock.getById.mockResolvedValue(makeUser(3))
      await useUserStore.getState().loadUser(3)
      expect(useUserStore.getState().currentUser?.id).toBe(3)
    })
  })

  describe('updateRole()', () => {
    it('met à jour le rôle dans la liste et currentUser', async () => {
      const user = makeUser(1)
      useUserStore.setState({ users: [user], currentUser: user })
      const updated = { ...user, role: 'ADMIN' as const }
      mock.updateRole.mockResolvedValue(updated)
      await useUserStore.getState().updateRole(1, 'ADMIN')
      expect(useUserStore.getState().users[0].role).toBe('ADMIN')
      expect(useUserStore.getState().currentUser?.role).toBe('ADMIN')
    })
  })

  describe('remove()', () => {
    it('retire l\'utilisateur de la liste', async () => {
      useUserStore.setState({ users: [makeUser(1), makeUser(2)] })
      mock.remove.mockResolvedValue(undefined)
      await useUserStore.getState().remove(1)
      expect(useUserStore.getState().users).toHaveLength(1)
      expect(useUserStore.getState().users[0].id).toBe(2)
    })
  })

  describe('disableMfa()', () => {
    it('met mfaEnabled à false sur currentUser', async () => {
      const user = { ...makeUser(1), mfaEnabled: true }
      useUserStore.setState({ currentUser: user, users: [user] })
      mock.disableMfa.mockResolvedValue(undefined)
      await useUserStore.getState().disableMfa(1)
      expect(useUserStore.getState().currentUser?.mfaEnabled).toBe(false)
    })
  })
})
