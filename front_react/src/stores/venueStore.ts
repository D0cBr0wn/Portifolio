import { create } from 'zustand'
import type { Venue, VenueData, VenueWithCreator } from '@portfolio/shared'
import { venueService } from '@/services/venueService'
import { backofficeService } from '@/services/backofficeService'

interface VenueState {
  venues: Venue[]
  backofficeVenues: VenueWithCreator[]
  loading: boolean
  error: string | null
  load: () => Promise<void>
  loadBackoffice: () => Promise<void>
  create: (data: Omit<VenueData, 'id'>) => Promise<void>
  update: (id: number, data: Partial<Omit<VenueData, 'id'>>) => Promise<void>
  remove: (id: number) => Promise<void>
}

export const useVenueStore = create<VenueState>((set) => ({
  venues: [],
  backofficeVenues: [],
  loading: false,
  error: null,

  async load() {
    set({ loading: true, error: null })
    try {
      const venues = await venueService.getAll()
      set({ venues })
    } catch {
      set({ error: 'Impossible de charger les lieux.' })
    } finally {
      set({ loading: false })
    }
  },

  async loadBackoffice() {
    set({ loading: true, error: null })
    try {
      const backofficeVenues = await backofficeService.getVenues()
      set({ backofficeVenues })
    } catch {
      set({ error: 'Impossible de charger les lieux (backoffice).' })
    } finally {
      set({ loading: false })
    }
  },

  async create(data) {
    set({ loading: true, error: null })
    try {
      const venue = await venueService.create(data)
      set((s) => ({ venues: [...s.venues, venue] }))
    } catch {
      set({ error: 'Impossible de créer le lieu.' })
    } finally {
      set({ loading: false })
    }
  },

  async update(id, data) {
    set({ loading: true, error: null })
    try {
      const venue = await venueService.update(id, data)
      set((s) => ({ venues: s.venues.map((v) => v.id === id ? venue : v) }))
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Impossible de modifier le lieu.'
      set({ error: msg })
      throw e
    } finally {
      set({ loading: false })
    }
  },

  async remove(id) {
    set({ loading: true, error: null })
    try {
      await venueService.remove(id)
      set((s) => ({ venues: s.venues.filter((v) => v.id !== id) }))
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Impossible de supprimer le lieu.'
      set({ error: msg })
      throw e
    } finally {
      set({ loading: false })
    }
  },
}))
