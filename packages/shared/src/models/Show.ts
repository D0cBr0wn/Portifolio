import type { ShowData } from '../types/api.js'
import { Venue } from './Venue.js'

export class Show {
  id: number
  label: string
  date: Date
  venueId: number
  venue?: Venue

  constructor(data: ShowData) {
    this.id = data.id
    this.label = data.label
    this.date = new Date(data.date)
    this.venueId = data.venueId
    this.venue = data.venue ? new Venue(data.venue) : undefined
  }

  getFormattedDate(): string {
    return this.date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }
}
