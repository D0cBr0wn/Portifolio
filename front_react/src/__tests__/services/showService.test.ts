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

import { api } from '../../services/api'
const mockApi = api as { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> }

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
    it('retourne un tableau de Show instanciées', async () => {
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

    it('la venue imbriquée est instanciée en Venue', async () => {
      mockApi.get.mockResolvedValue([showData])
      const result = await showService.getAll()
      expect(result[0].venue).toBeInstanceOf(Venue)
      expect(result[0].venue?.name).toBe('Le Zénith')
    })
  })

  describe('create()', () => {
    it('envoie les données et retourne un Show', async () => {
      mockApi.post.mockResolvedValue({ ...showData, id: 11 })
      const payload = { label: 'Nouveau', date: '2025-09-01T20:00:00.000Z', venueId: 1 }
      const result = await showService.create(payload)
      expect(result).toBeInstanceOf(Show)
      expect(result.id).toBe(11)
      expect(mockApi.post).toHaveBeenCalledWith('/shows', payload)
    })

    it('accepte un show sans label (optionnel)', async () => {
      mockApi.post.mockResolvedValue({ ...showData, id: 12, label: undefined })
      const result = await showService.create({ date: '2025-09-01T20:00:00.000Z', venueId: 1 })
      expect(result.label).toBeUndefined()
    })
  })

  describe('update()', () => {
    it('envoie les données et retourne le Show mis à jour', async () => {
      mockApi.put.mockResolvedValue({ ...showData, label: 'Modifié' })
      const result = await showService.update(10, { label: 'Modifié' })
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
