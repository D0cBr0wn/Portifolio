import { z } from 'zod'

export const contactMessageSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  message: z.string().min(1).max(2000),
})

export type ContactMessageInput = z.infer<typeof contactMessageSchema>
