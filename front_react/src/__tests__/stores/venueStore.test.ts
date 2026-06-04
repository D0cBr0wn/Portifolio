import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useVenueStore } from '../../stores/venueStore'
import { Venue } from '@portfolio/shared'

vi.mock('../../services/venueService', () => ({
  venueService: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}))
vi.mock('../../services/backofficeService', () => ({
  backofficeService: { getShows: vi.fn(), getVenues: vi.fn() },
}))

import { venueService } from '../../services/venueService'
import { backofficeService } from '../../services/backofficeService'
const mockVenue = venueService as { getAll: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn> }
const mockBo    = backofficeService as { getVenues: ReturnType<typeof vi.fn> }

const INITIAL = { venues: [], backofficeVenues: [], loading: false, error: null }
const makeVenue = (id: number) => new Venue({ id, name: `Venue ${id}`, city: 'Paris' })
const boVenue = { id: 1, name: 'BO Venue', city: 'Lyon', createdBy: null, createdAt: '2025-01-01' }

describe('venueStore', () => {
  beforeEach(() => {
    useVenueStore.setState(INITIAL)
    vi.clearAllMocks()
  })

  describe('load()', () => {
    it('charge les venues', async () => {
      mockVenue.getAll.mockResolvedValue([makeVenue(1)])
      await useVenueStore.getState().load()
      expect(useVenueStore.getState().venues).toHaveLength(1)
      expect(useVenueStore.getState().loading).toBe(false)
    })

    it('définit error en cas d\'échec', async () => {
      mockVenue.getAll.mockRejectedValue(new Error('fail'))
      await useVenueStore.getState().load()
      expect(useVenueStore.getState().error).toBeTruthy()
    })
  })

  describe('loadBackoffice()', () => {
    it('charge les venues backoffice', async () => {
      mockBo.getVenues.mockResolvedValue([boVenue])
      await useVenueStore.getState().loadBackoffice()
      expect(useVenueStore.getState().backofficeVenues).toHaveLength(1)
    })
  })

  describe('create()', () => {
    it('ajoute la nouvelle venue à la liste', async () => {
      const created = makeVenue(5)
      mockVenue.create.mockResolvedValue(created)
      await useVenueStore.getState().create({ name: 'Venue 5', city: 'Paris' })
      expect(useVenueStore.getState().venues).toContainEqual(created)
    })
  })

  describe('update()', () => {
    it('remplace la venue mise à jour', async () => {
      useVenueStore.setState({ venues: [makeVenue(1)] })
      const updated = new Venue({ id: 1, name: 'Modifié', city: 'Lyon' })
      mockVenue.update.mockResolvedValue(updated)
      await useVenueStore.getState().update(1, { name: 'Modifié' })
      expect(useVenueStore.getState().venues[0].name).toBe('Modifié')
    })
  })

  describe('remove()', () => {
    it('retire la venue supprimée', async () => {
      useVenueStore.setState({ venues: [makeVenue(1), makeVenue(2)] })
      mockVenue.remove.mockResolvedValue(undefined)
      await useVenueStore.getState().remove(1)
      expect(useVenueStore.getState().venues).toHaveLength(1)
      expect(useVenueStore.getState().venues[0].id).toBe(2)
    })
  })
})
