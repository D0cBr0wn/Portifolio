import type { VenueData } from '../types/api.js'

export class Venue {
  id: number
  name: string
  city: string
  address1?: string
  address2?: string
  zipCode?: string

  constructor(data: VenueData) {
    this.id = data.id
    this.name = data.name
    this.city = data.city
    this.address1 = data.address1
    this.address2 = data.address2
    this.zipCode = data.zipCode
  }

  getFullAddress(): string {
    return [this.address1, this.address2, this.zipCode, this.city]
      .filter(Boolean)
      .join(', ')
  }
}
