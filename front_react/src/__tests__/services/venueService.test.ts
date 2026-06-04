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

import { api } from '../../services/api'
const mockApi = api as { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> }

const venueData = { id: 1, name: 'Le Zénith', city: 'Paris', address1: '211 avenue Jean Jaurès' }

describe('venueService', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('getAll()', () => {
    it('retourne un tableau de Venue instanciées', async () => {
      mockApi.get.mockResolvedValue([venueData])
      const result = await venueService.getAll()
      expect(result).toHaveLength(1)
      expect(result[0]).toBeInstanceOf(Venue)
      expect(result[0].name).toBe('Le Zénith')
      expect(mockApi.get).toHaveBeenCalledWith('/venues')
    })
  })

  describe('create()', () => {
    it('envoie les données et retourne une Venue', async () => {
      mockApi.post.mockResolvedValue({ ...venueData, id: 2 })
      const payload = { name: 'Olympia', city: 'Paris' }
      const result = await venueService.create(payload)
      expect(result).toBeInstanceOf(Venue)
      expect(result.id).toBe(2)
      expect(mockApi.post).toHaveBeenCalledWith('/venues', payload)
    })
  })

  describe('update()', () => {
    it('envoie les données et retourne la Venue mise à jour', async () => {
      mockApi.put.mockResolvedValue({ ...venueData, city: 'Lyon' })
      const result = await venueService.update(1, { city: 'Lyon' })
      expect(result.city).toBe('Lyon')
      expect(mockApi.put).toHaveBeenCalledWith('/venues/1', { city: 'Lyon' })
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
