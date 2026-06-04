import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useShowStore } from '../../stores/showStore'
import { Show } from '@portfolio/shared'

vi.mock('../../services/showService', () => ({
  showService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}))
vi.mock('../../services/backofficeService', () => ({
  backofficeService: {
    getShows: vi.fn(),
    getVenues: vi.fn(),
  },
}))

import { showService } from '../../services/showService'
import { backofficeService } from '../../services/backofficeService'
const mockShow = showService as { getAll: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn> }
const mockBo   = backofficeService as { getShows: ReturnType<typeof vi.fn> }

const INITIAL = { shows: [], backofficeShows: [], loading: false, error: null }

const makeShow = (id: number) => new Show({ id, label: `Show ${id}`, date: '2025-01-01T00:00:00.000Z', venueId: 1 })
const boShow = { id: 1, label: 'BO Show', date: '2025-01-01', venueId: 1, createdBy: null, createdAt: '2025-01-01' }

describe('showStore', () => {
  beforeEach(() => {
    useShowStore.setState(INITIAL)
    vi.clearAllMocks()
  })

  describe('load()', () => {
    it('charge les shows et met loading à false', async () => {
      mockShow.getAll.mockResolvedValue([makeShow(1)])
      await useShowStore.getState().load()
      const s = useShowStore.getState()
      expect(s.shows).toHaveLength(1)
      expect(s.loading).toBe(false)
      expect(s.error).toBeNull()
    })

    it('définit error en cas d\'échec', async () => {
      mockShow.getAll.mockRejectedValue(new Error('network'))
      await useShowStore.getState().load()
      expect(useShowStore.getState().error).toBeTruthy()
      expect(useShowStore.getState().loading).toBe(false)
    })
  })

  describe('loadBackoffice()', () => {
    it('charge les shows backoffice', async () => {
      mockBo.getShows.mockResolvedValue([boShow])
      await useShowStore.getState().loadBackoffice()
      expect(useShowStore.getState().backofficeShows).toHaveLength(1)
    })
  })

  describe('create()', () => {
    it('ajoute le nouveau show à la liste', async () => {
      const created = makeShow(42)
      mockShow.create.mockResolvedValue(created)
      await useShowStore.getState().create({ date: '2025-06-01T20:00:00.000Z', venueId: 1 })
      expect(useShowStore.getState().shows).toContainEqual(created)
    })
  })

  describe('update()', () => {
    it('remplace le show mis à jour dans la liste', async () => {
      const original = makeShow(1)
      useShowStore.setState({ shows: [original] })
      const updated = makeShow(1)
      updated.label = 'Modifié'
      mockShow.update.mockResolvedValue(updated)
      await useShowStore.getState().update(1, { label: 'Modifié' })
      expect(useShowStore.getState().shows[0].label).toBe('Modifié')
    })
  })

  describe('remove()', () => {
    it('retire le show supprimé de la liste', async () => {
      useShowStore.setState({ shows: [makeShow(1), makeShow(2)] })
      mockShow.remove.mockResolvedValue(undefined)
      await useShowStore.getState().remove(1)
      expect(useShowStore.getState().shows).toHaveLength(1)
      expect(useShowStore.getState().shows[0].id).toBe(2)
    })
  })
})
