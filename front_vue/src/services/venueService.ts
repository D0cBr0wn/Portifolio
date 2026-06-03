import { api } from './api'
import { Venue } from '@portfolio/shared'
import type { VenueData } from '@portfolio/shared'

export const venueService = {
  getAll: async (): Promise<Venue[]> => {
    const data = await api.get<VenueData[]>('/venues')
    return data.map((d) => new Venue(d))
  },

  create: async (payload: Omit<VenueData, 'id'>): Promise<Venue> => {
    const data = await api.post<VenueData>('/venues', payload)
    return new Venue(data)
  },
}
