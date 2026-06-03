import { z } from 'zod'

export const showSchema = z.object({
  label: z.string().min(1, 'Le label est requis'),
  date: z.string().refine((d) => !isNaN(Date.parse(d)), { message: 'Date invalide' }),
  venueId: z.number().int().positive('venueId doit être un entier positif'),
})

export type ShowInput = z.infer<typeof showSchema>
