import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

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

vi.mock('../../stores/authStore', () => ({
  useAuthStore: () => ({ token: 'fake-token' }),
}))

import { useShowStore } from '../../stores/showStore'
import { backofficeService } from '../../services/backofficeService'

const mockBackoffice = backofficeService as { getShows: ReturnType<typeof vi.fn> }

const fakeBackofficeShow = {
  id: 1, label: 'Concert été', date: '2025-07-14T20:00:00.000Z', venueId: 1,
  createdBy: { email: 'admin@test.com' }, createdAt: '2025-01-01T00:00:00.000Z',
}

describe('showStore — loadBackoffice()', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('charge les concerts backoffice et met à jour backofficeShows', async () => {
    mockBackoffice.getShows.mockResolvedValue([fakeBackofficeShow])

    const store = useShowStore()
    await store.loadBackoffice()

    expect(mockBackoffice.getShows).toHaveBeenCalledOnce()
    expect(store.backofficeShows).toHaveLength(1)
    expect(store.backofficeShows[0].createdBy).toEqual({ email: 'admin@test.com' })
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('définit error si l\'API échoue', async () => {
    mockBackoffice.getShows.mockRejectedValue(new Error('Network error'))

    const store = useShowStore()
    await store.loadBackoffice()

    expect(store.backofficeShows).toHaveLength(0)
    expect(store.error).toBeTruthy()
    expect(store.loading).toBe(false)
  })
})
