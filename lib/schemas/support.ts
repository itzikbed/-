import { z } from 'zod'
import { initHebrewValidation } from './he-errors'

initHebrewValidation()

export const supportMessageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, { message: 'אי אפשר לשלוח הודעה ריקה' })
    .max(2000, { message: 'הודעה יכולה להכיל עד 2000 תווים' })
})

export type SupportMessageInput = z.infer<typeof supportMessageSchema>
