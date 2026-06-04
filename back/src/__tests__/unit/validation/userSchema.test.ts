import { updateUserSchema } from '../../../schemas/user.schema'

describe('updateUserSchema', () => {
  it('accepte un email seul', () => {
    expect(() => updateUserSchema.parse({ email: 'new@test.com' })).not.toThrow()
  })

  it('accepte un password seul', () => {
    expect(() => updateUserSchema.parse({ password: 'newpassword' })).not.toThrow()
  })

  it('accepte email et password ensemble', () => {
    expect(() => updateUserSchema.parse({ email: 'new@test.com', password: 'newpassword' })).not.toThrow()
  })

  it('rejette un objet vide (aucun champ)', () => {
    expect(() => updateUserSchema.parse({})).toThrow()
  })

  it('rejette un email invalide', () => {
    expect(() => updateUserSchema.parse({ email: 'pas-un-email' })).toThrow()
  })

  it('rejette un password trop court (< 6 chars)', () => {
    expect(() => updateUserSchema.parse({ password: '123' })).toThrow()
  })
})
