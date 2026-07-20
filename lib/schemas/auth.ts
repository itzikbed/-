import { z } from 'zod'
import { initHebrewValidation } from './he-errors'

initHebrewValidation()

const captchaTokenSchema = z.string().trim().min(1).max(2048).optional()

export const loginSchema = z.object({
  email: z.string().trim().max(254).email({ message: 'כתובת אימייל לא תקינה' }),
  password: z.string().min(6, { message: 'הסיסמה חייבת להכיל לפחות 6 תווים' }).max(128),
  captchaToken: captchaTokenSchema
})

export type LoginInput = z.infer<typeof loginSchema>

export const signupSchema = z.object({
  email: z.string().trim().max(254).email({ message: 'כתובת אימייל לא תקינה' }),
  password: z.string().min(8, { message: 'הסיסמה חייבת להכיל לפחות 8 תווים' }).max(128),
  fullName: z.string().trim().min(2, { message: 'יש להזין שם מלא בן 2 תווים לפחות' }).max(100),
  phone: z.string().regex(/^05\d-?\d{7}$/, { message: 'מספר טלפון נייד לא תקין (למשל 0501234567)' }),
  consent: z.boolean().refine((v) => v === true, {
    message: 'כדי להמשיך יש לאשר גיל 18 ומעלה, את תנאי השימוש ואת מדיניות הפרטיות'
  }),
  captchaToken: captchaTokenSchema
})

export type SignupInput = z.infer<typeof signupSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().trim().max(254).email({ message: 'כתובת אימייל לא תקינה' }),
  captchaToken: captchaTokenSchema
})

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
