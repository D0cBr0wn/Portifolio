import { create } from 'zustand'
import type { Show, ShowData, ShowWithCreator } from '@portfolio/shared'
import { showService } from '@/services/showService'
import { backofficeService } from '@/services/backofficeService'

interface ShowState {
  shows: Show[]
  backofficeShows: ShowWithCreator[]
  loading: boolean
  error: string | null
  load: () => Promise<void>
  loadBackoffice: () => Promise<void>
  create: (data: Omit<ShowData, 'id' | 'venue'>) => Promise<void>
  update: (id: number, data: Partial<Omit<ShowData, 'id' | 'venue'>>) => Promise<void>
  remove: (id: number) => Promise<void>
}

export const useShowStore = create<ShowState>((set, get) => ({
  shows: [],
  backofficeShows: [],
  loading: false,
  error: null,

  async load() {
    set({ loading: true, error: null })
    try {
      const shows = await showService.getAll()
      set({ shows })
    } catch {
      set({ error: 'Impossible de charger les concerts.' })
    } finally {
      set({ loading: false })
    }
  },

  async loadBackoffice() {
    set({ loading: true, error: null })
    try {
      const backofficeShows = await backofficeService.getShows()
      set({ backofficeShows })
    } catch {
      set({ error: 'Impossible de charger les concerts (backoffice).' })
    } finally {
      set({ loading: false })
    }
  },

  async create(data) {
    set({ loading: true, error: null })
    try {
      const show = await showService.create(data)
      set((s) => ({ shows: [...s.shows, show] }))
    } catch {
      set({ error: 'Impossible de créer le concert.' })
    } finally {
      set({ loading: false })
    }
  },

  async update(id, data) {
    set({ loading: true, error: null })
    try {
      const show = await showService.update(id, data)
      set((s) => ({ shows: s.shows.map((sh) => sh.id === id ? show : sh) }))
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Impossible de modifier le concert.'
      set({ error: msg })
      throw e
    } finally {
      set({ loading: false })
    }
  },

  async remove(id) {
    set({ loading: true, error: null })
    try {
      await showService.remove(id)
      set((s) => ({ shows: s.shows.filter((sh) => sh.id !== id) }))
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Impossible de supprimer le concert.'
      set({ error: msg })
      throw e
    } finally {
      set({ loading: false })
    }
  },

  clearError() {
    set({ error: null })
  },
}))
