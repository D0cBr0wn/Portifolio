import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Contact from '../../pages/Contact'

vi.mock('../../services/contactService', () => ({
  contactService: {
    sendMessage: vi.fn(),
  },
}))

import { contactService } from '../../services/contactService'
const mockContact = contactService as { sendMessage: ReturnType<typeof vi.fn> }

function renderContact() {
  return render(<MemoryRouter><Contact /></MemoryRouter>)
}

async function fillForm(name = 'Alice', email = 'alice@example.com', message = 'Bonjour !') {
  await userEvent.type(screen.getByTestId('name-input'), name)
  await userEvent.type(screen.getByTestId('email-input'), email)
  await userEvent.type(screen.getByTestId('message-input'), message)
}

describe('Contact', () => {
  beforeEach(() => vi.clearAllMocks())

  it('affiche le titre et le formulaire', () => {
    renderContact()
    expect(screen.getByRole('heading', { name: 'Contact' })).toBeInTheDocument()
    expect(screen.getByTestId('name-input')).toBeInTheDocument()
    expect(screen.getByTestId('email-input')).toBeInTheDocument()
    expect(screen.getByTestId('message-input')).toBeInTheDocument()
    expect(screen.getByTestId('submit-btn')).toBeInTheDocument()
  })

  it('affiche des erreurs si les champs sont vides à la soumission', async () => {
    renderContact()
    await userEvent.click(screen.getByTestId('submit-btn'))
    expect(await screen.findByText(/nom est requis/i)).toBeInTheDocument()
    expect(await screen.findByText(/email est requis/i)).toBeInTheDocument()
    expect(await screen.findByText(/message est requis/i)).toBeInTheDocument()
    expect(mockContact.sendMessage).not.toHaveBeenCalled()
  })

  it("affiche une erreur si l'email est invalide", async () => {
    renderContact()
    await userEvent.type(screen.getByTestId('name-input'), 'Alice')
    await userEvent.type(screen.getByTestId('email-input'), 'not-an-email')
    await userEvent.type(screen.getByTestId('message-input'), 'Bonjour')
    await userEvent.click(screen.getByTestId('submit-btn'))
    expect(await screen.findByText(/email n'est pas valide/i)).toBeInTheDocument()
    expect(mockContact.sendMessage).not.toHaveBeenCalled()
  })

  it('affiche le message de succès et réinitialise le formulaire', async () => {
    mockContact.sendMessage.mockResolvedValue({ id: 1, name: 'Alice', email: 'alice@example.com', message: 'Bonjour !', createdAt: '2025-06-01T10:00:00.000Z' })
    renderContact()
    await fillForm()
    await userEvent.click(screen.getByTestId('submit-btn'))
    expect(await screen.findByTestId('success-alert')).toBeInTheDocument()
    expect(screen.getByTestId('name-input')).toHaveValue('')
    expect(screen.getByTestId('email-input')).toHaveValue('')
    expect(screen.getByTestId('message-input')).toHaveValue('')
  })

  it('affiche une erreur serveur en cas d\'échec', async () => {
    mockContact.sendMessage.mockRejectedValue(new Error('500'))
    renderContact()
    await fillForm()
    await userEvent.click(screen.getByTestId('submit-btn'))
    expect(await screen.findByTestId('server-error')).toBeInTheDocument()
  })

  it('appelle sendMessage avec les bonnes données', async () => {
    mockContact.sendMessage.mockResolvedValue({ id: 1, name: 'Alice', email: 'alice@example.com', message: 'Bonjour !', createdAt: '2025-06-01T10:00:00.000Z' })
    renderContact()
    await fillForm()
    await userEvent.click(screen.getByTestId('submit-btn'))
    expect(mockContact.sendMessage).toHaveBeenCalledWith({ name: 'Alice', email: 'alice@example.com', message: 'Bonjour !' })
  })
})
