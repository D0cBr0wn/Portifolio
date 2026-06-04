import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VenueForm from '../../components/backoffice/VenueForm'
import { Venue } from '@portfolio/shared'

const onSubmit = vi.fn()
const onCancel = vi.fn()

describe('VenueForm', () => {
  beforeEach(() => {
    onSubmit.mockClear()
    onCancel.mockClear()
  })

  it('affiche le titre "Nouveau lieu" quand pas de initial', () => {
    render(<VenueForm onSubmit={onSubmit} onCancel={onCancel} />)
    expect(screen.getByText('Nouveau lieu')).toBeInTheDocument()
  })

  it('affiche le titre "Modifier le lieu" quand initial est fourni', () => {
    const venue = new Venue({ id: 1, name: 'Zénith', city: 'Paris' })
    render(<VenueForm initial={venue} onSubmit={onSubmit} onCancel={onCancel} />)
    expect(screen.getByText('Modifier le lieu')).toBeInTheDocument()
  })

  it('pré-remplit les champs avec la valeur de initial', () => {
    const venue = new Venue({ id: 1, name: 'Olympia', city: 'Paris', zipCode: '75018' })
    render(<VenueForm initial={venue} onSubmit={onSubmit} onCancel={onCancel} />)
    expect(screen.getByDisplayValue('Olympia')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Paris')).toBeInTheDocument()
    expect(screen.getByDisplayValue('75018')).toBeInTheDocument()
  })

  it('appelle onSubmit avec les données correctes', async () => {
    render(<VenueForm onSubmit={onSubmit} onCancel={onCancel} />)
    await userEvent.type(screen.getByLabelText(/Nom du lieu/), 'Le Rex')
    await userEvent.type(screen.getByLabelText(/Ville/), 'Paris')
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Le Rex', city: 'Paris' }))
  })

  it('affiche les erreurs si nom ou ville sont vides', async () => {
    render(<VenueForm onSubmit={onSubmit} onCancel={onCancel} />)
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(await screen.findAllByText('Champ requis')).toHaveLength(2)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('appelle onCancel au clic sur Annuler', async () => {
    render(<VenueForm onSubmit={onSubmit} onCancel={onCancel} />)
    await userEvent.click(screen.getByText('Annuler'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('désactive le bouton Enregistrer quand loading=true', () => {
    render(<VenueForm onSubmit={onSubmit} onCancel={onCancel} loading />)
    expect(screen.getByText('Enregistrer').closest('button')).toBeDisabled()
  })
})
