import { z } from 'zod'
import { initHebrewValidation } from './he-errors'

initHebrewValidation()

export const publisherApplicationSchema = z.object({
  fullName: z.string().min(2, { message: 'יש להזין שם מלא בן 2 תווים לפחות' }),
  phone: z.string().regex(/^05\d-?\d{7}$/, { message: 'מספר טלפון נייד לא תקין (למשל 0501234567)' }),
  age: z.number({ required_error: 'שדה חובה' })
    .int({ message: 'הגיל חייב להיות מספר שלם' })
    .min(16, { message: 'הגיל חייב להיות לפחות 16' })
    .max(120, { message: 'הגיל אינו תקין' }),
  publisherType: z.enum(['private', 'organization'], {
    errorMap: () => ({ message: 'נא לבחור סוג מוסר' })
  }),
  region: z.enum(['north', 'south', 'center', 'jerusalem', 'yosh'], {
    errorMap: () => ({ message: 'נא לבחור אזור מגורים' })
  }),
  city: z.string().min(1, { message: 'שדה חובה' })
})

export type PublisherApplicationInput = z.infer<typeof publisherApplicationSchema>
