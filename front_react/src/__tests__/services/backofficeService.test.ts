import { describe, it, expect, vi, beforeEach } from 'vitest'
import { backofficeService } from '../../services/backofficeService'

vi.mock('../../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

import { api } from '../../services/api'
const mockApi = api as { get: ReturnType<typeof vi.fn> }

describe('backofficeService', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('getShows()', () => {
    it('retourne les shows avec créateur depuis /backoffice/shows', async () => {
      const shows = [{ id: 1, label: 'Show BO', date: '2025-01-01', venueId: 1, createdBy: { email: 'admin@test.com' }, createdAt: '2025-01-01' }]
      mockApi.get.mockResolvedValue(shows)
      const result = await backofficeService.getShows()
      expect(result).toEqual(shows)
      expect(mockApi.get).toHaveBeenCalledWith('/backoffice/shows')
    })
  })

  describe('getVenues()', () => {
    it('retourne les venues avec créateur depuis /backoffice/venues', async () => {
      const venues = [{ id: 1, name: 'Salle', city: 'Lyon', createdBy: { email: 'admin@test.com' }, createdAt: '2025-01-01' }]
      mockApi.get.mockResolvedValue(venues)
      const result = await backofficeService.getVenues()
      expect(result).toEqual(venues)
      expect(mockApi.get).toHaveBeenCalledWith('/backoffice/venues')
    })
  })
})
