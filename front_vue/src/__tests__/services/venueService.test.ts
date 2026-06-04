import { describe, it, expect, vi, beforeEach } from 'vitest'
import { venueService } from '../../services/venueService'
import { Venue } from '@portfolio/shared'

vi.mock('../../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('../../stores/authStore', () => ({
  useAuthStore: () => ({ token: null }),
}))

import { api } from '../../services/api'

const mockApi = api as {
  get: ReturnType<typeof vi.fn>
  post: ReturnType<typeof vi.fn>
  put: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
}

const venueData = { id: 1, name: 'Le Zénith', city: 'Paris', address1: '211 Av. Jean Jaurès', zipCode: '75019' }

describe('venueService', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('getAll()', () => {
    it('retourne un tableau de Venue instanciées depuis l\'API', async () => {
      mockApi.get.mockResolvedValue([venueData])

      const result = await venueService.getAll()

      expect(result).toHaveLength(1)
      expect(result[0]).toBeInstanceOf(Venue)
      expect(result[0].name).toBe('Le Zénith')
      expect(mockApi.get).toHaveBeenCalledWith('/venues')
    })

    it('retourne un tableau vide si l\'API renvoie []', async () => {
      mockApi.get.mockResolvedValue([])
      const result = await venueService.getAll()
      expect(result).toEqual([])
    })

    it('les instances Venue ont les méthodes de la classe', async () => {
      mockApi.get.mockResolvedValue([venueData])
      const result = await venueService.getAll()
      expect(typeof result[0].getFullAddress).toBe('function')
      expect(result[0].getFullAddress()).toBe('211 Av. Jean Jaurès, 75019, Paris')
    })
  })

  describe('create()', () => {
    it('envoie les données à l\'API et retourne une Venue', async () => {
      mockApi.post.mockResolvedValue(venueData)

      const payload = { name: 'Le Zénith', city: 'Paris' }
      const result = await venueService.create(payload)

      expect(result).toBeInstanceOf(Venue)
      expect(result.id).toBe(1)
      expect(mockApi.post).toHaveBeenCalledWith('/venues', payload)
    })
  })

  describe('update()', () => {
    it('envoie les données à l\'API et retourne une Venue mise à jour', async () => {
      const updated = { ...venueData, name: 'Nouveau Nom' }
      mockApi.put.mockResolvedValue(updated)

      const result = await venueService.update(1, { name: 'Nouveau Nom' })

      expect(result).toBeInstanceOf(Venue)
      expect(result.name).toBe('Nouveau Nom')
      expect(mockApi.put).toHaveBeenCalledWith('/venues/1', { name: 'Nouveau Nom' })
    })
  })

  describe('remove()', () => {
    it('appelle DELETE sur le bon endpoint', async () => {
      mockApi.delete.mockResolvedValue(undefined)

      await venueService.remove(1)

      expect(mockApi.delete).toHaveBeenCalledWith('/venues/1')
    })
  })
})
