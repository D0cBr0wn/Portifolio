import { api } from './api'
import type { ShowWithCreator, VenueWithCreator } from '@portfolio/shared'

export const backofficeService = {
  getShows: (): Promise<ShowWithCreator[]> => api.get<ShowWithCreator[]>('/backoffice/shows'),
  getVenues: (): Promise<VenueWithCreator[]> => api.get<VenueWithCreator[]>('/backoffice/venues'),
}
