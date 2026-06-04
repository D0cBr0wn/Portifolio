import { describe, it, expect } from 'vitest'
import { Show } from '../models/Show.js'
import { Venue } from '../models/Venue.js'

describe('Show', () => {
  const venueData = { id: 1, name: 'Le Zénith', city: 'Paris' }
  const showData = {
    id: 10,
    label: 'Concert d\'été',
    date: '2025-07-14T20:00:00.000Z',
    venueId: 1,
    venue: venueData,
  }

  it('construit une instance avec tous les champs', () => {
    const show = new Show(showData)
    expect(show).toBeInstanceOf(Show)
    expect(show.id).toBe(10)
    expect(show.label).toBe('Concert d\'été')
    expect(show.venueId).toBe(1)
  })

  it('accepte un label absent (optionnel)', () => {
    const { label: _, ...rest } = showData
    const show = new Show(rest)
    expect(show.label).toBeUndefined()
  })

  it('stocke le champ details quand présent', () => {
    const show = new Show({ ...showData, details: 'Portes à 19h' })
    expect(show.details).toBe('Portes à 19h')
  })

  it('laisse details à undefined si absent', () => {
    const show = new Show(showData)
    expect(show.details).toBeUndefined()
  })

  it('convertit la date string en instance Date', () => {
    const show = new Show(showData)
    expect(show.date).toBeInstanceOf(Date)
    expect(show.date.getFullYear()).toBe(2025)
    expect(show.date.getMonth()).toBe(6) // juillet = 6
  })

  it('instancie venue en classe Venue quand présente', () => {
    const show = new Show(showData)
    expect(show.venue).toBeInstanceOf(Venue)
    expect(show.venue?.name).toBe('Le Zénith')
  })

  it('laisse venue à undefined si absent', () => {
    const { venue: _, ...dataWithoutVenue } = showData
    const show = new Show(dataWithoutVenue)
    expect(show.venue).toBeUndefined()
  })

  describe('getFormattedDate()', () => {
    it('retourne une date formatée en français', () => {
      const show = new Show({ ...showData, date: '2025-07-14T20:00:00.000Z' })
      const formatted = show.getFormattedDate()
      expect(formatted).toMatch(/14/)
      expect(formatted.toLowerCase()).toMatch(/juillet/)
      expect(formatted).toMatch(/2025/)
    })

    it('retourne un format lisible (jour chiffre + mois texte + année)', () => {
      const show = new Show({ ...showData, date: '2025-12-25T18:00:00.000Z' })
      const formatted = show.getFormattedDate()
      expect(formatted.toLowerCase()).toMatch(/d[eé]cembre/)
    })
  })
})
