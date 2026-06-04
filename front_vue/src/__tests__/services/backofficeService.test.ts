import { describe, it, expect, vi, beforeEach } from 'vitest'
import { backofficeService } from '../../services/backofficeService'

vi.mock('../../services/api', () => ({
  api: { get: vi.fn() },
}))

vi.mock('../../stores/authStore', () => ({
  useAuthStore: () => ({ token: 'fake-token' }),
}))

import { api } from '../../services/api'

const mockApi = api as { get: ReturnType<typeof vi.fn> }

const fakeShow = {
  id: 1, label: 'Concert été', date: '2025-07-14T20:00:00.000Z', venueId: 1,
  venue: { id: 1, name: 'Le Zénith', city: 'Paris' },
  createdBy: { email: 'admin@test.com' }, createdAt: '2025-01-01T00:00:00.000Z',
}
const fakeVenue = {
  id: 1, name: 'Le Zénith', city: 'Paris',
  createdBy: { email: 'admin@test.com' }, createdAt: '2025-01-01T00:00:00.000Z',
}

describe('backofficeService', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('getShows()', () => {
    it('appelle GET /backoffice/shows et retourne les données', async () => {
      mockApi.get.mockResolvedValue([fakeShow])

      const result = await backofficeService.getShows()

      expect(mockApi.get).toHaveBeenCalledWith('/backoffice/shows')
      expect(result).toHaveLength(1)
      expect(result[0].createdBy).toEqual({ email: 'admin@test.com' })
    })

    it('retourne un tableau vide si l\'API renvoie []', async () => {
      mockApi.get.mockResolvedValue([])
      const result = await backofficeService.getShows()
      expect(result).toEqual([])
    })
  })

  describe('getVenues()', () => {
    it('appelle GET /backoffice/venues et retourne les données', async () => {
      mockApi.get.mockResolvedValue([fakeVenue])

      const result = await backofficeService.getVenues()

      expect(mockApi.get).toHaveBeenCalledWith('/backoffice/venues')
      expect(result).toHaveLength(1)
      expect(result[0].createdBy).toEqual({ email: 'admin@test.com' })
    })

    it('retourne createdBy: null pour un élément sans créateur', async () => {
      mockApi.get.mockResolvedValue([{ ...fakeVenue, createdBy: null }])
      const result = await backofficeService.getVenues()
      expect(result[0].createdBy).toBeNull()
    })
  })
})
