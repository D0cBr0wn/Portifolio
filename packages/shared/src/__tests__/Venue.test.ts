import { describe, it, expect } from 'vitest'
import { Venue } from '../models/Venue.js'

describe('Venue', () => {
  const fullData = {
    id: 1,
    name: 'Le Zénith',
    city: 'Paris',
    address1: '211 Avenue Jean Jaurès',
    address2: 'Salle A',
    zipCode: '75019',
  }

  it('construit une instance avec tous les champs', () => {
    const venue = new Venue(fullData)
    expect(venue).toBeInstanceOf(Venue)
    expect(venue.id).toBe(1)
    expect(venue.name).toBe('Le Zénith')
    expect(venue.city).toBe('Paris')
    expect(venue.address1).toBe('211 Avenue Jean Jaurès')
    expect(venue.address2).toBe('Salle A')
    expect(venue.zipCode).toBe('75019')
  })

  it('construit une instance sans les champs optionnels', () => {
    const venue = new Venue({ id: 2, name: 'La Cigale', city: 'Paris' })
    expect(venue.address1).toBeUndefined()
    expect(venue.address2).toBeUndefined()
    expect(venue.zipCode).toBeUndefined()
  })

  describe('getFullAddress()', () => {
    it('retourne toutes les parties quand tous les champs sont présents', () => {
      const venue = new Venue(fullData)
      expect(venue.getFullAddress()).toBe('211 Avenue Jean Jaurès, Salle A, 75019, Paris')
    })

    it('retourne uniquement la ville quand les champs optionnels manquent', () => {
      const venue = new Venue({ id: 1, name: 'La Cigale', city: 'Paris' })
      expect(venue.getFullAddress()).toBe('Paris')
    })

    it('ignore les champs undefined dans la concaténation', () => {
      const venue = new Venue({ id: 1, name: 'Le Bataclan', city: 'Paris', address1: '50 Bd Voltaire' })
      expect(venue.getFullAddress()).toBe('50 Bd Voltaire, Paris')
    })
  })
})
