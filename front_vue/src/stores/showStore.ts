import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Show } from '@portfolio/shared'

export const useShowStore = defineStore('show', () => {
  const shows = ref<Show[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  return { shows, loading, error }
})
