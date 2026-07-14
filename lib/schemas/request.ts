import { z } from 'zod'
import { initHebrewValidation } from './he-errors'

initHebrewValidation()

export const adoptionRequestSchema = z.object({
  catId: z.string().uuid(),
  message: z.string().min(10, { message: 'הודעת פנייה חייבת להכיל לפחות 10 תווים' })
})

export type AdoptionRequestInput = z.infer<typeof adoptionRequestSchema>
