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

  async function update(id: number, data: Partial<Omit<ShowData, 'id' | 'venue'>>) {
    loading.value = true
    error.value = null
    try {
      const show = await showService.update(id, data)
      const idx = shows.value.findIndex((s) => s.id === id)
      if (idx !== -1) shows.value[idx] = show
      return show
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Impossible de modifier le concert.'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function remove(id: number) {
    loading.value = true
    error.value = null
    try {
      await showService.remove(id)
      shows.value = shows.value.filter((s) => s.id !== id)
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Impossible de supprimer le concert.'
      throw e
    } finally {
      loading.value = false
    }
  }

  return { shows, loading, error, load, create, update, remove }
})
