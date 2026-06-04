import { create } from 'zustand'
import type { UserData } from '@portfolio/shared'
import { userService } from '@/services/userService'

interface UserState {
  users: UserData[]
  currentUser: UserData | null
  loading: boolean
  error: string | null
  load: () => Promise<void>
  loadUser: (id: number) => Promise<void>
  updateRole: (id: number, role: 'USER' | 'ADMIN') => Promise<void>
  updatePassword: (id: number, password: string) => Promise<void>
  requireMfa: (id: number) => Promise<void>
  disableMfa: (id: number) => Promise<void>
  remove: (id: number) => Promise<void>
  clearError: () => void
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  currentUser: null,
  loading: false,
  error: null,

  async load() {
    set({ loading: true, error: null })
    try {
      const users = await userService.getAll()
      set({ users })
    } catch {
      set({ error: 'Impossible de charger les utilisateurs.' })
    } finally {
      set({ loading: false })
    }
  },

  async loadUser(id) {
    set({ loading: true, error: null })
    try {
      const currentUser = await userService.getById(id)
      set({ currentUser })
    } catch {
      set({ error: "Impossible de charger l'utilisateur." })
    } finally {
      set({ loading: false })
    }
  },

  async updateRole(id, role) {
    set({ loading: true, error: null })
    try {
      const updated = await userService.updateRole(id, role)
      set((s) => ({
        currentUser: s.currentUser?.id === id ? updated : s.currentUser,
        users: s.users.map((u) => u.id === id ? updated : u),
      }))
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : 'Impossible de modifier le rôle.' })
      throw e
    } finally {
      set({ loading: false })
    }
  },

  async updatePassword(id, password) {
    set({ loading: true, error: null })
    try {
      await userService.updatePassword(id, password)
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : 'Impossible de modifier le mot de passe.' })
      throw e
    } finally {
      set({ loading: false })
    }
  },

  async requireMfa(id) {
    set({ loading: true, error: null })
    try {
      await userService.requireMfa(id)
      const patch = { mfaEnabled: false }
      set((s) => ({
        users: s.users.map((u) => u.id === id ? { ...u, ...patch } : u),
        currentUser: s.currentUser?.id === id ? { ...s.currentUser, ...patch } : s.currentUser,
      }))
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : "Impossible d'activer le MFA." })
      throw e
    } finally {
      set({ loading: false })
    }
  },

  async disableMfa(id) {
    set({ loading: true, error: null })
    try {
      await userService.disableMfa(id)
      const patch = { mfaEnabled: false }
      set((s) => ({
        users: s.users.map((u) => u.id === id ? { ...u, ...patch } : u),
        currentUser: s.currentUser?.id === id ? { ...s.currentUser, ...patch } : s.currentUser,
      }))
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : 'Impossible de désactiver le MFA.' })
      throw e
    } finally {
      set({ loading: false })
    }
  },

  async remove(id) {
    set({ loading: true, error: null })
    try {
      await userService.remove(id)
      set((s) => ({ users: s.users.filter((u) => u.id !== id) }))
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : "Impossible de supprimer l'utilisateur." })
      throw e
    } finally {
      set({ loading: false })
    }
  },

  clearError() {
    set({ error: null })
  },
}))
