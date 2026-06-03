import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Venue, VenueData } from '@portfolio/shared'
import { venueService } from '@/services/venueService'

export const useVenueStore = defineStore('venue', () => {
  const venues = ref<Venue[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    loading.value = true
    error.value = null
    try {
      venues.value = await venueService.getAll()
    } catch {
      error.value = 'Impossible de charger les lieux.'
    } finally {
      loading.value = false
    }
  }

  async function create(data: Omit<VenueData, 'id'>) {
    loading.value = true
    error.value = null
    try {
      const venue = await venueService.create(data)
      venues.value.push(venue)
      return venue
    } catch {
      error.value = 'Impossible de créer le lieu.'
    } finally {
      loading.value = false
    }
  }

  return { venues, loading, error, load, create }
})
