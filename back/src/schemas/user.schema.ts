import { z } from 'zod'

export const updateUserSchema = z
  .object({
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
  })
  .refine((data) => data.email !== undefined || data.password !== undefined, {
    message: 'Au moins un champ (email ou password) est requis',
  })

export type UpdateUserInput = z.infer<typeof updateUserSchema>
