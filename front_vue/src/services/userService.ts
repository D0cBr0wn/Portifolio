import { api } from './api'
import type { UserData } from '@portfolio/shared'

export const userService = {
  getAll: async (): Promise<UserData[]> => {
    return api.get<UserData[]>('/users')
  },

  remove: async (id: number): Promise<void> => {
    await api.delete<void>(`/users/${id}`)
  },
}
