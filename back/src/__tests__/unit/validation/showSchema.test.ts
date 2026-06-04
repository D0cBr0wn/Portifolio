import { showSchema } from '../../../schemas/show.schema'

const validPayload = { label: 'Concert été', date: '2025-07-14T20:00:00.000Z', venueId: 1 }

describe('showSchema', () => {
  it('accepte un payload valide', () => {
    expect(() => showSchema.parse(validPayload)).not.toThrow()
  })

  it('rejette un label vide', () => {
    expect(() => showSchema.parse({ ...validPayload, label: '' })).toThrow()
  })

  it('accepte un label absent (label optionnel)', () => {
    const { label: _, ...rest } = validPayload
    expect(() => showSchema.parse(rest)).not.toThrow()
  })

  it('accepte un payload avec details', () => {
    expect(() => showSchema.parse({ ...validPayload, details: 'Portes à 19h' })).not.toThrow()
  })

  it('accepte un payload sans details', () => {
    expect(() => showSchema.parse(validPayload)).not.toThrow()
  })

  it('rejette une date invalide (texte libre)', () => {
    expect(() => showSchema.parse({ ...validPayload, date: 'pas-une-date' })).toThrow()
  })

  it('rejette une date absente', () => {
    const { date: _, ...rest } = validPayload
    expect(() => showSchema.parse(rest)).toThrow()
  })

  it('rejette un venueId négatif', () => {
    expect(() => showSchema.parse({ ...validPayload, venueId: -1 })).toThrow()
  })

  it('rejette un venueId nul', () => {
    expect(() => showSchema.parse({ ...validPayload, venueId: 0 })).toThrow()
  })

  it('rejette un venueId non entier', () => {
    expect(() => showSchema.parse({ ...validPayload, venueId: 1.5 })).toThrow()
  })

  it('rejette un venueId absent', () => {
    const { venueId: _, ...rest } = validPayload
    expect(() => showSchema.parse(rest)).toThrow()
  })

  it('accepte une date en format ISO complet', () => {
    const result = showSchema.parse({ ...validPayload, date: '2025-12-31T23:59:59.000Z' })
    expect(result.date).toBe('2025-12-31T23:59:59.000Z')
  })
})
