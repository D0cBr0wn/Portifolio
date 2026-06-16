import { api } from './api'

export interface ContactMessage {
  id: number
  name: string
  email: string
  message: string
  createdAt: string
}

export interface ContactPayload {
  name: string
  email: string
  message: string
}

export const contactService = {
  sendMessage: async (payload: ContactPayload): Promise<ContactMessage> => {
    return await api.post<ContactMessage>('/contact', payload)
  },

  getMessages: async (): Promise<ContactMessage[]> => {
    return await api.get<ContactMessage[]>('/contact')
  },

  deleteMessage: async (id: number): Promise<void> => {
    return await api.delete<void>(`/contact/${id}`)
  },
}
