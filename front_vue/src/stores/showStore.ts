import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Show, ShowData } from '@portfolio/shared'
import { showService } from '@/services/showService'

export const useShowStore = defineStore('show', () => {
  const shows = ref<Show[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    loading.value = true
    error.value = null
    try {
      shows.value = await showService.getAll()
    } catch {
      error.value = 'Impossible de charger les concerts.'
    } finally {
      loading.value = false
    }
  }

  async function create(data: Omit<ShowData, 'id' | 'venue'>) {
    loading.value = true
    error.value = null
    try {
      const show = await showService.create(data)
      shows.value.push(show)
      return show
    } catch {
      error.value = 'Impossible de créer le concert.'
    } finally {
      loading.value = false
    }
  }

  return { shows, loading, error, load, create }
})
