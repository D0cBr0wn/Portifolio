import { api } from './api'
import type { UserData } from '@portfolio/shared'

export const userService = {
  getAll: async (): Promise<UserData[]> => api.get<UserData[]>('/users'),

  getById: async (id: number): Promise<UserData> => api.get<UserData>(`/users/${id}`),

  updateRole: async (id: number, role: 'USER' | 'ADMIN'): Promise<UserData> =>
    api.patch<UserData>(`/users/${id}/role`, { role }),

  updatePassword: async (id: number, password: string): Promise<UserData> =>
    api.put<UserData>(`/users/${id}`, { password }),

  requireMfa: async (id: number): Promise<void> =>
    api.post<void>(`/users/${id}/mfa/require`, {}),

  disableMfa: async (id: number): Promise<void> =>
    api.delete<void>(`/users/${id}/mfa`),

  remove: async (id: number): Promise<void> =>
    api.delete<void>(`/users/${id}`),
}
