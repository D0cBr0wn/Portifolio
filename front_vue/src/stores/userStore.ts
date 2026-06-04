import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserData } from '@portfolio/shared'
import { userService } from '@/services/userService'

export const useUserStore = defineStore('user', () => {
  const users = ref<UserData[]>([])
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

  return { users, loading, error, load, remove }
})
