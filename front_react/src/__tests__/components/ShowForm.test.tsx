import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ShowForm from '../../components/backoffice/ShowForm'
import { Show, Venue } from '@portfolio/shared'

const onSubmit = vi.fn()
const onCancel = vi.fn()

const venues = [
  new Venue({ id: 1, name: 'Zénith', city: 'Paris' }),
  new Venue({ id: 2, name: 'Olympia', city: 'Paris' }),
]

describe('ShowForm', () => {
  beforeEach(() => {
    onSubmit.mockClear()
    onCancel.mockClear()
  })

  it('affiche le titre "Nouveau concert" sans initial', () => {
    render(<ShowForm venues={venues} onSubmit={onSubmit} onCancel={onCancel} />)
    expect(screen.getByText('Nouveau concert')).toBeInTheDocument()
  })

  it('affiche le titre "Modifier le concert" avec initial', () => {
    const show = new Show({ id: 1, date: '2025-07-14T20:00:00.000Z', venueId: 1 })
    render(<ShowForm venues={venues} initial={show} onSubmit={onSubmit} onCancel={onCancel} />)
    expect(screen.getByText('Modifier le concert')).toBeInTheDocument()
  })

  it('pré-remplit la date sans lever TypeError quand initial.date est un objet Date', () => {
    const show = new Show({ id: 1, date: '2025-07-14T20:00:00.000Z', venueId: 1, label: 'Été' })
    render(<ShowForm venues={venues} initial={show} onSubmit={onSubmit} onCancel={onCancel} />)
    const dateInput = document.querySelector('input[type="datetime-local"]') as HTMLInputElement
    expect(dateInput).not.toBeNull()
    expect(dateInput.value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
  })

  it('pré-remplit le label avec la valeur de initial', () => {
    const show = new Show({ id: 1, date: '2025-07-14T20:00:00.000Z', venueId: 1, label: 'Festival été' })
    render(<ShowForm venues={venues} initial={show} onSubmit={onSubmit} onCancel={onCancel} />)
    expect(screen.getByDisplayValue('Festival été')).toBeInTheDocument()
  })

  it('appelle onCancel au clic sur Annuler', async () => {
    render(<ShowForm venues={venues} onSubmit={onSubmit} onCancel={onCancel} />)
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('désactive le bouton Enregistrer quand loading=true', () => {
    render(<ShowForm venues={venues} onSubmit={onSubmit} onCancel={onCancel} loading />)
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled()
  })

  it('affiche les erreurs si date ou lieu sont vides', async () => {
    render(<ShowForm venues={venues} onSubmit={onSubmit} onCancel={onCancel} />)
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(await screen.findAllByText('Champ requis')).toHaveLength(2)
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
