import { z } from 'zod'
import { initHebrewValidation } from './he-errors'

initHebrewValidation()

export const loginSchema = z.object({
  email: z.string().trim().max(254).email({ message: 'כתובת אימייל לא תקינה' }),
  password: z.string().min(6, { message: 'הסיסמה חייבת להכיל לפחות 6 תווים' }).max(128)
})

export type LoginInput = z.infer<typeof loginSchema>

export const signupSchema = z.object({
  email: z.string().trim().max(254).email({ message: 'כתובת אימייל לא תקינה' }),
  password: z.string().min(8, { message: 'הסיסמה חייבת להכיל לפחות 8 תווים' }).max(128),
  fullName: z.string().trim().min(2, { message: 'יש להזין שם מלא בן 2 תווים לפחות' }).max(100),
  phone: z.string().regex(/^05\d-?\d{7}$/, { message: 'מספר טלפון נייד לא תקין (למשל 0501234567)' })
})

export type SignupInput = z.infer<typeof signupSchema>
