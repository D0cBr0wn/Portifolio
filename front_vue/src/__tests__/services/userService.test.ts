import { describe, it, expect, vi, beforeEach } from 'vitest'
import { userService } from '../../services/userService'

vi.mock('../../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('../../stores/authStore', () => ({
  useAuthStore: () => ({ token: 'fake-token' }),
}))

import { api } from '../../services/api'

const mockApi = api as {
  get: ReturnType<typeof vi.fn>
  post: ReturnType<typeof vi.fn>
  put: ReturnType<typeof vi.fn>
  patch: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
}

const fakeUser = { id: 1, email: 'user@test.com', role: 'USER' as const, mfaEnabled: false, createdAt: '2025-01-01T00:00:00.000Z' }

describe('userService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getAll() appelle GET /users', async () => {
    mockApi.get.mockResolvedValue([fakeUser])
    const result = await userService.getAll()
    expect(mockApi.get).toHaveBeenCalledWith('/users')
    expect(result).toHaveLength(1)
  })

  it('getById() appelle GET /users/:id', async () => {
    mockApi.get.mockResolvedValue(fakeUser)
    const result = await userService.getById(1)
    expect(mockApi.get).toHaveBeenCalledWith('/users/1')
    expect(result.email).toBe('user@test.com')
  })

  it('updateRole() appelle PATCH /users/:id/role', async () => {
    mockApi.patch.mockResolvedValue({ ...fakeUser, role: 'ADMIN' })
    const result = await userService.updateRole(1, 'ADMIN')
    expect(mockApi.patch).toHaveBeenCalledWith('/users/1/role', { role: 'ADMIN' })
    expect(result.role).toBe('ADMIN')
  })

  it('updatePassword() appelle PUT /users/:id avec password', async () => {
    mockApi.put.mockResolvedValue(fakeUser)
    await userService.updatePassword(1, 'newpassword')
    expect(mockApi.put).toHaveBeenCalledWith('/users/1', { password: 'newpassword' })
  })

  it('requireMfa() appelle POST /users/:id/mfa/require', async () => {
    mockApi.post.mockResolvedValue(undefined)
    await userService.requireMfa(1)
    expect(mockApi.post).toHaveBeenCalledWith('/users/1/mfa/require', {})
  })

  it('disableMfa() appelle DELETE /users/:id/mfa', async () => {
    mockApi.delete.mockResolvedValue(undefined)
    await userService.disableMfa(1)
    expect(mockApi.delete).toHaveBeenCalledWith('/users/1/mfa')
  })

  it('remove() appelle DELETE /users/:id', async () => {
    mockApi.delete.mockResolvedValue(undefined)
    await userService.remove(1)
    expect(mockApi.delete).toHaveBeenCalledWith('/users/1')
  })
})
