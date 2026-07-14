import { z } from 'zod'
import { initHebrewValidation } from './he-errors'

initHebrewValidation()

export const adoptionRequestSchema = z.object({
  catId: z.string().uuid({ message: 'מזהה חתול לא תקין' }),
  message: z.string().min(10, { message: 'ההודעה חייבת להכיל לפחות 10 תווים' })
})

export type AdoptionRequestInput = z.infer<typeof adoptionRequestSchema>
