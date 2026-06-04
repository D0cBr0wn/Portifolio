import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('../../services/venueService', () => ({
  venueService: {
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

vi.mock('../../stores/authStore', () => ({
  useAuthStore: () => ({ token: 'fake-token' }),
}))

import { useVenueStore } from '../../stores/venueStore'
import { backofficeService } from '../../services/backofficeService'

const mockBackoffice = backofficeService as { getVenues: ReturnType<typeof vi.fn> }

const fakeBackofficeVenue = {
  id: 1, name: 'Le Zénith', city: 'Paris',
  createdBy: { email: 'admin@test.com' }, createdAt: '2025-01-01T00:00:00.000Z',
}

describe('venueStore — loadBackoffice()', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('charge les lieux backoffice et met à jour backofficeVenues', async () => {
    mockBackoffice.getVenues.mockResolvedValue([fakeBackofficeVenue])

    const store = useVenueStore()
    await store.loadBackoffice()

    expect(mockBackoffice.getVenues).toHaveBeenCalledOnce()
    expect(store.backofficeVenues).toHaveLength(1)
    expect(store.backofficeVenues[0].createdBy).toEqual({ email: 'admin@test.com' })
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('définit error si l\'API échoue', async () => {
    mockBackoffice.getVenues.mockRejectedValue(new Error('Network error'))

    const store = useVenueStore()
    await store.loadBackoffice()

    expect(store.backofficeVenues).toHaveLength(0)
    expect(store.error).toBeTruthy()
    expect(store.loading).toBe(false)
  })
})
