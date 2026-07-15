import { z } from 'zod'
import { initHebrewValidation } from './he-errors'

initHebrewValidation()

export const questionnaireBaseSchema = z.object({
  // Step 1: Personal Info
  age: z.number()
    .int({ message: 'הגיל חייב להיות מספר שלם' })
    .min(16, { message: 'הגיל חייב להיות לפחות 16' })
    .max(120, { message: 'הגיל אינו תקין' }),
  city: z.string().trim().min(1, { message: 'שדה חובה' }).max(100),
  household_desc: z.string().trim().min(5, { message: 'אנא פרטו מי גר בבית (לפחות 5 תווים)' }).max(1000),

  // Step 2: Home
  has_other_pets: z.boolean(),
  other_pets_desc: z.string().max(1000).optional().nullable(),
  has_cat_experience: z.boolean(),
  floor_type: z.enum(['ground_house', 'garden_floor', 'floor_1', 'floor_2', 'floor_3_plus'], { message: 'נא לבחור סוג קומה' }),
  has_window_screens: z.boolean(),

  // Step 3: Motivation
  adoption_reason: z.string().trim().min(10, { message: 'אנא הסבירו למה אתם רוצים לאמץ (לפחות 10 תווים)' }).max(2000),
  surrender_circumstances: z.string().trim().min(10, { message: 'אנא הסבירו באילו נסיבות תמסרו את החתול (לפחות 10 תווים)' }).max(2000),
  vet_clinic: z.string().max(200).optional().nullable()
})

export const questionnaireSchema = questionnaireBaseSchema.superRefine((
  data: {
    has_other_pets: boolean
    other_pets_desc?: string | null
  },
  ctx: z.RefinementCtx
) => {
  if (data.has_other_pets && (!data.other_pets_desc || data.other_pets_desc.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'שדה חובה',
      path: ['other_pets_desc']
    })
  }
})

export type QuestionnaireInput = z.infer<typeof questionnaireSchema>
