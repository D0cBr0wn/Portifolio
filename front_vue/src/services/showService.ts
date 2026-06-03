import { api } from './api'
import { Show } from '@portfolio/shared'
import type { ShowData } from '@portfolio/shared'

export const showService = {
  getAll: async (): Promise<Show[]> => {
    const data = await api.get<ShowData[]>('/shows')
    return data.map((d) => new Show(d))
  },

  create: async (payload: Omit<ShowData, 'id' | 'venue'>): Promise<Show> => {
    const data = await api.post<ShowData>('/shows', payload)
    return new Show(data)
  },
}
