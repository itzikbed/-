import { z } from 'zod'
import { initHebrewValidation } from './he-errors'

initHebrewValidation()

export const adoptionRequestSchema = z.object({
  catId: z.string().uuid({ message: 'מזהה חתול לא תקין' }),
  message: z.string().trim().min(10, { message: 'ההודעה חייבת להכיל לפחות 10 תווים' }).max(2000)
})

export type AdoptionRequestInput = z.infer<typeof adoptionRequestSchema>
