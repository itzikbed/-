import { z } from 'zod'
import { initHebrewValidation } from './he-errors'

initHebrewValidation()

export const questionnaireSchema = z.object({
  // Step 1: Personal Info
  age: z.number({ required_error: 'שדה חובה' })
    .int({ message: 'הגיל חייב להיות מספר שלם' })
    .min(16, { message: 'הגיל חייב להיות לפחות 16' })
    .max(120, { message: 'הגיל אינו תקין' }),
  city: z.string().min(1, { message: 'שדה חובה' }),
  household_desc: z.string().min(5, { message: 'אנא פרטו מי גר בבית (לפחות 5 תווים)' }),

  // Step 2: Home
  has_other_pets: z.boolean(),
  other_pets_desc: z.string().optional().nullable(),
  has_cat_experience: z.boolean(),
  floor_type: z.enum(['ground_house', 'garden_floor', 'floor_1', 'floor_2', 'floor_3_plus'], {
    errorMap: () => ({ message: 'נא לבחור סוג קומה' })
  }),
  has_window_screens: z.boolean(),

  // Step 3: Motivation
  adoption_reason: z.string().min(10, { message: 'אנא הסבירו למה אתם רוצים לאמץ (לפחות 10 תווים)' }),
  surrender_circumstances: z.string().min(10, { message: 'אנא הסבירו באילו נסיבות תמסרו את החתול (לפחות 10 תווים)' }),
  vet_clinic: z.string().optional().nullable()
}).superRefine((data, ctx) => {
  if (data.has_other_pets && (!data.other_pets_desc || data.other_pets_desc.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'שדה חובה',
      path: ['other_pets_desc']
    })
  }
})

export type QuestionnaireInput = z.infer<typeof questionnaireSchema>
