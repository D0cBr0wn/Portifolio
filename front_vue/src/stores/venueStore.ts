import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Venue } from '@portfolio/shared'

export const useVenueStore = defineStore('venue', () => {
  const venues = ref<Venue[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  return { venues, loading, error }
})
