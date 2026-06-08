import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Login from '../../pages/Login'
import { useAuthStore } from '../../stores/authStore'

vi.mock('../../services/authService', () => ({
  authService: {
    login: vi.fn(),
    verifyMfa: vi.fn(),
    setupMfaWithToken: vi.fn(),
    confirmMfaWithToken: vi.fn(),
  },
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => vi.fn() }
})

import { authService } from '../../services/authService'
const mockAuth = authService as { login: ReturnType<typeof vi.fn>; verifyMfa: ReturnType<typeof vi.fn> }

function renderLogin() {
  return render(<MemoryRouter><Login /></MemoryRouter>)
}

describe('Login', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, isAuthenticated: false, isAdmin: false })
    vi.clearAllMocks()
  })

  it('affiche le titre "Connexion" initialement', () => {
    renderLogin()
    expect(screen.getByText('Connexion')).toBeInTheDocument()
  })

  it('affiche le champ email et mot de passe', () => {
    renderLogin()
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Mot de passe/i)).toBeInTheDocument()
  })

  it('affiche une erreur si les champs sont vides à la soumission', async () => {
    renderLogin()
    await userEvent.click(screen.getByRole('button', { name: /Se connecter/i }))
    expect(await screen.findByText(/email est requis/i)).toBeInTheDocument()
  })

  it('affiche une erreur serveur sur identifiants invalides', async () => {
    mockAuth.login.mockRejectedValue(new Error('401'))
    renderLogin()
    await userEvent.type(screen.getByLabelText(/Email/i), 'a@b.com')
    await userEvent.type(screen.getByLabelText(/Mot de passe/i), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: /Se connecter/i }))
    expect(await screen.findByText(/Identifiants invalides/i)).toBeInTheDocument()
  })

  it('affiche l\'étape MFA après une réponse mfaRequired', async () => {
    mockAuth.login.mockResolvedValue({ mfaRequired: true, mfaPendingToken: 'pending-jwt' })
    renderLogin()
    await userEvent.type(screen.getByLabelText(/Email/i), 'a@b.com')
    await userEvent.type(screen.getByLabelText(/Mot de passe/i), 'pass')
    await userEvent.click(screen.getByRole('button', { name: /Se connecter/i }))
    await waitFor(() => expect(screen.getByText(/Vérification MFA/i)).toBeInTheDocument())
  })
})
