import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../services/contactService', () => ({
  contactService: {
    getMessages: vi.fn(),
  },
}))

vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn((selector) => {
    const state = { logout: vi.fn(), isAdmin: true, isAuthenticated: true }
    return selector ? selector(state) : state
  }),
}))

import { contactService } from '../../services/contactService'
import BackofficeMessages from '../../pages/backoffice/Messages'

const mockContactService = contactService as unknown as { getMessages: ReturnType<typeof vi.fn> }

const mockMessages = [
  {
    id: 1,
    name: 'Alice',
    email: 'alice@example.com',
    message: 'Bonjour, je voulais vous contacter concernant votre portfolio.',
    createdAt: '2025-06-01T10:00:00.000Z',
  },
  {
    id: 2,
    name: 'Bob',
    email: 'bob@example.com',
    message: 'Super travail !',
    createdAt: '2025-06-02T12:00:00.000Z',
  },
]

function renderPage() {
  return render(
    <MemoryRouter>
      <BackofficeMessages />
    </MemoryRouter>,
  )
}

describe('BackofficeMessages', () => {
  beforeEach(() => vi.clearAllMocks())

  it('affiche le titre de la page', async () => {
    mockContactService.getMessages.mockResolvedValue([])
    renderPage()
    expect(screen.getByRole('heading', { name: /messages de contact/i })).toBeInTheDocument()
  })

  it('appelle getMessages au montage', async () => {
    mockContactService.getMessages.mockResolvedValue([])
    renderPage()
    await waitFor(() => expect(mockContactService.getMessages).toHaveBeenCalledOnce())
  })

  it('affiche les messages dans le tableau', async () => {
    mockContactService.getMessages.mockResolvedValue(mockMessages)
    renderPage()
    expect(await screen.findByText('Alice')).toBeInTheDocument()
    expect(await screen.findByText('bob@example.com')).toBeInTheDocument()
  })

  it('tronque les messages longs dans la liste', async () => {
    const longMessage = 'A'.repeat(80)
    mockContactService.getMessages.mockResolvedValue([
      { id: 1, name: 'Test', email: 'test@test.com', message: longMessage, createdAt: '2025-01-01T00:00:00.000Z' },
    ])
    renderPage()
    await waitFor(() => {
      expect(screen.queryByText(longMessage)).not.toBeInTheDocument()
    })
  })

  it('affiche une erreur si la requête échoue', async () => {
    mockContactService.getMessages.mockRejectedValue(new Error('Network error'))
    renderPage()
    expect(await screen.findByTestId('messages-error')).toBeInTheDocument()
  })

  it('ouvre la modale avec le message complet au clic sur une ligne', async () => {
    mockContactService.getMessages.mockResolvedValue(mockMessages)
    renderPage()
    const row = await screen.findByText('Alice')
    await userEvent.click(row)
    expect(await screen.findByTestId('modal-message')).toHaveTextContent(mockMessages[0].message)
  })

  it('ferme la modale en cliquant sur le bouton de fermeture', async () => {
    mockContactService.getMessages.mockResolvedValue(mockMessages)
    renderPage()
    const row = await screen.findByText('Alice')
    await userEvent.click(row)
    await screen.findByTestId('modal-message')
    await userEvent.click(screen.getByTestId('close-modal-btn'))
    await waitFor(() => {
      expect(screen.queryByTestId('modal-message')).not.toBeInTheDocument()
    })
  })
})
