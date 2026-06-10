import { describe, it, expect, vi, beforeEach } from 'vitest'
import { contactService } from '../../services/contactService'

vi.mock('../../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

import { api } from '../../services/api'
const mockApi = api as { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> }

describe('contactService', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('sendMessage()', () => {
    it('POST /contact et retourne le message créé', async () => {
      const payload = { name: 'Alice', email: 'alice@example.com', message: 'Bonjour !' }
      const response = { id: 1, ...payload, createdAt: '2025-06-01T10:00:00.000Z' }
      mockApi.post.mockResolvedValue(response)
      const result = await contactService.sendMessage(payload)
      expect(result).toEqual(response)
      expect(mockApi.post).toHaveBeenCalledWith('/contact', payload)
    })
  })

  describe('getMessages()', () => {
    it('GET /contact et retourne la liste des messages', async () => {
      const messages = [
        { id: 1, name: 'Alice', email: 'alice@example.com', message: 'Bonjour !', createdAt: '2025-06-01T10:00:00.000Z' },
      ]
      mockApi.get.mockResolvedValue(messages)
      const result = await contactService.getMessages()
      expect(result).toEqual(messages)
      expect(mockApi.get).toHaveBeenCalledWith('/contact')
    })
  })

  describe('deleteMessage()', () => {
    it('DELETE /contact/:id', async () => {
      mockApi.delete.mockResolvedValue(undefined)
      const result = await contactService.deleteMessage(1)
      expect(result).toBeUndefined()
      expect(mockApi.delete).toHaveBeenCalledWith('/contact/1')
    })
  })
})
