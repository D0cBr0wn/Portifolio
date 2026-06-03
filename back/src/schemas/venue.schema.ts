import { z } from 'zod'

export const venueSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  city: z.string().min(1, 'La ville est requise'),
  address1: z.string().optional(),
  address2: z.string().optional(),
  zipCode: z.string().optional(),
})

export type VenueInput = z.infer<typeof venueSchema>
