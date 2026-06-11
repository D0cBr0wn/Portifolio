import { describe, it, expect, vi, beforeEach } from 'vitest'
import { contactService } from '../../services/contactService'

vi.mock('../../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
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
  delete: ReturnType<typeof vi.fn>
}

const messageData = {
  id: 1,
  name: 'Alice',
  email: 'alice@example.com',
  message: 'Bonjour !',
  createdAt: '2025-06-01T10:00:00.000Z',
}

describe('contactService', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('sendMessage()', () => {
    it('envoie le payload à POST /contact et retourne le message créé', async () => {
      mockApi.post.mockResolvedValue(messageData)

      const payload = { name: 'Alice', email: 'alice@example.com', message: 'Bonjour !' }
      const result = await contactService.sendMessage(payload)

      expect(result).toEqual(messageData)
      expect(mockApi.post).toHaveBeenCalledWith('/contact', payload)
    })

    it('propage l\'erreur si l\'API échoue', async () => {
      mockApi.post.mockRejectedValue(new Error('Rate limit exceeded'))

      await expect(
        contactService.sendMessage({ name: 'X', email: 'x@x.com', message: 'test' })
      ).rejects.toThrow('Rate limit exceeded')
    })
  })

  describe('getMessages()', () => {
    it('retourne la liste des messages depuis GET /contact', async () => {
      mockApi.get.mockResolvedValue([messageData])

      const result = await contactService.getMessages()

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(messageData)
      expect(mockApi.get).toHaveBeenCalledWith('/contact')
    })

    it('retourne un tableau vide si aucun message', async () => {
      mockApi.get.mockResolvedValue([])

      const result = await contactService.getMessages()

      expect(result).toEqual([])
    })
  })

  describe('deleteMessage()', () => {
    it('appelle DELETE /contact/:id', async () => {
      mockApi.delete.mockResolvedValue(undefined)

      const result = await contactService.deleteMessage(1)

      expect(result).toBeUndefined()
      expect(mockApi.delete).toHaveBeenCalledWith('/contact/1')
    })
  })
})
