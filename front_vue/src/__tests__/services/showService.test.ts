import { describe, it, expect, vi, beforeEach } from 'vitest'
import { showService } from '../../services/showService'
import { Show, Venue } from '@portfolio/shared'

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

const showData = {
  id: 10,
  label: 'Concert été',
  date: '2025-07-14T20:00:00.000Z',
  venueId: 1,
  venue: { id: 1, name: 'Le Zénith', city: 'Paris' },
}

describe('showService', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('getAll()', () => {
    it('retourne un tableau de Show instanciées depuis l\'API', async () => {
      mockApi.get.mockResolvedValue([showData])

      const result = await showService.getAll()

      expect(result).toHaveLength(1)
      expect(result[0]).toBeInstanceOf(Show)
      expect(result[0].label).toBe('Concert été')
      expect(mockApi.get).toHaveBeenCalledWith('/shows')
    })

    it('la date est convertie en instance Date', async () => {
      mockApi.get.mockResolvedValue([showData])
      const result = await showService.getAll()
      expect(result[0].date).toBeInstanceOf(Date)
      expect(result[0].date.getFullYear()).toBe(2025)
    })

    it('la venue imbriquée est instanciée en classe Venue', async () => {
      mockApi.get.mockResolvedValue([showData])
      const result = await showService.getAll()
      expect(result[0].venue).toBeInstanceOf(Venue)
      expect(result[0].venue?.name).toBe('Le Zénith')
    })

    it('getFormattedDate() retourne une date lisible en français', async () => {
      mockApi.get.mockResolvedValue([showData])
      const result = await showService.getAll()
      const formatted = result[0].getFormattedDate()
      expect(formatted).toMatch(/2025/)
      expect(formatted.toLowerCase()).toMatch(/juillet/)
    })
  })

  describe('create()', () => {
    it('envoie les données à l\'API et retourne un Show', async () => {
      const created = { ...showData, id: 11, venue: undefined }
      mockApi.post.mockResolvedValue(created)

      const payload = { label: 'Nouveau', date: '2025-09-01T20:00:00.000Z', venueId: 1 }
      const result = await showService.create(payload)

      expect(result).toBeInstanceOf(Show)
      expect(result.id).toBe(11)
      expect(mockApi.post).toHaveBeenCalledWith('/shows', payload)
    })

    it('accepte un show sans label (label optionnel)', async () => {
      const created = { ...showData, id: 12, label: undefined }
      mockApi.post.mockResolvedValue(created)

      const payload = { date: '2025-09-01T20:00:00.000Z', venueId: 1 }
      const result = await showService.create(payload)

      expect(result).toBeInstanceOf(Show)
      expect(result.label).toBeUndefined()
    })
  })

  describe('update()', () => {
    it('envoie les données à l\'API et retourne un Show mis à jour', async () => {
      const updated = { ...showData, label: 'Modifié' }
      mockApi.put.mockResolvedValue(updated)

      const result = await showService.update(10, { label: 'Modifié' })

      expect(result).toBeInstanceOf(Show)
      expect(result.label).toBe('Modifié')
      expect(mockApi.put).toHaveBeenCalledWith('/shows/10', { label: 'Modifié' })
    })
  })

  describe('remove()', () => {
    it('appelle DELETE sur le bon endpoint', async () => {
      mockApi.delete.mockResolvedValue(undefined)

      await showService.remove(10)

      expect(mockApi.delete).toHaveBeenCalledWith('/shows/10')
    })
  })
})
