import { venueSchema } from '../../../schemas/venue.schema'

const validPayload = { name: 'Le Zénith', city: 'Paris' }

describe('venueSchema', () => {
  it('accepte un payload minimal valide', () => {
    expect(() => venueSchema.parse(validPayload)).not.toThrow()
  })

  it('accepte un payload avec tous les champs optionnels', () => {
    const full = { ...validPayload, address1: '211 Av. Jean Jaurès', address2: 'Bât. A', zipCode: '75019' }
    expect(() => venueSchema.parse(full)).not.toThrow()
  })

  it('rejette un name vide', () => {
    expect(() => venueSchema.parse({ ...validPayload, name: '' })).toThrow()
  })

  it('rejette un name absent', () => {
    const { name: _, ...rest } = validPayload
    expect(() => venueSchema.parse(rest)).toThrow()
  })

  it('rejette une city vide', () => {
    expect(() => venueSchema.parse({ ...validPayload, city: '' })).toThrow()
  })

  it('rejette une city absente', () => {
    const { city: _, ...rest } = validPayload
    expect(() => venueSchema.parse(rest)).toThrow()
  })

  it('accepte address1 et address2 optionnels absents', () => {
    const result = venueSchema.parse(validPayload)
    expect(result.address1).toBeUndefined()
    expect(result.address2).toBeUndefined()
    expect(result.zipCode).toBeUndefined()
  })

  it('ignore les champs inconnus (strict: false par défaut)', () => {
    const result = venueSchema.parse({ ...validPayload, unknown: 'field' })
    expect((result as Record<string, unknown>).unknown).toBeUndefined()
  })
})
