import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserData } from '@portfolio/shared'
import { userService } from '@/services/userService'

export const useUserStore = defineStore('user', () => {
  const users = ref<UserData[]>([])
  const currentUser = ref<UserData | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    loading.value = true
    error.value = null
    try {
      users.value = await userService.getAll()
    } catch {
      error.value = 'Impossible de charger les utilisateurs.'
    } finally {
      loading.value = false
    }
  }

  async function loadUser(id: number) {
    loading.value = true
    error.value = null
    try {
      currentUser.value = await userService.getById(id)
    } catch {
      error.value = 'Impossible de charger l\'utilisateur.'
    } finally {
      loading.value = false
    }
  }

  async function updateRole(id: number, role: 'USER' | 'ADMIN') {
    loading.value = true
    error.value = null
    try {
      const updated = await userService.updateRole(id, role)
      currentUser.value = updated
      const idx = users.value.findIndex((u) => u.id === id)
      if (idx !== -1) users.value[idx] = updated
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Impossible de modifier le rôle.'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updatePassword(id: number, password: string) {
    loading.value = true
    error.value = null
    try {
      await userService.updatePassword(id, password)
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Impossible de modifier le mot de passe.'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function requireMfa(id: number) {
    loading.value = true
    error.value = null
    try {
      await userService.requireMfa(id)
      const patch = { mfaEnabled: false }
      const idx = users.value.findIndex((u) => u.id === id)
      if (idx !== -1) users.value[idx] = { ...users.value[idx], ...patch }
      if (currentUser.value?.id === id) currentUser.value = { ...currentUser.value, ...patch }
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Impossible d\'activer le MFA.'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function disableMfa(id: number) {
    loading.value = true
    error.value = null
    try {
      await userService.disableMfa(id)
      const patch = { mfaEnabled: false }
      const idx = users.value.findIndex((u) => u.id === id)
      if (idx !== -1) users.value[idx] = { ...users.value[idx], ...patch }
      if (currentUser.value?.id === id) currentUser.value = { ...currentUser.value, ...patch }
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Impossible de désactiver le MFA.'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function remove(id: number) {
    loading.value = true
    error.value = null
    try {
      await userService.remove(id)
      users.value = users.value.filter((u) => u.id !== id)
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Impossible de supprimer l\'utilisateur.'
      throw e
    } finally {
      loading.value = false
    }
  }

  return { users, currentUser, loading, error, load, loadUser, updateRole, updatePassword, requireMfa, disableMfa, remove }
})
