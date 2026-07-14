import { z } from 'zod'
import { initHebrewValidation } from './he-errors'

initHebrewValidation()

export const questionnaireSchema = z.object({
  age: z.number()
    .int({ message: 'הגיל חייב להיות מספר שלם' })
    .min(16, { message: 'הגיל חייב להיות לפחות 16' })
    .max(120, { message: 'הגיל חייב להיות לכל היותר 120' }),
  city: z.string().min(1, { message: 'שדה חובה' }),
  household_desc: z.string().min(1, { message: 'שדה חובה' }),
  has_other_pets: z.boolean(),
  other_pets_desc: z.string().optional().nullable(),
  has_cat_experience: z.boolean(),
  floor_type: z.enum(['ground_house', 'garden_floor', 'floor_1', 'floor_2', 'floor_3_plus']),
  has_window_screens: z.boolean(),
  adoption_reason: z.string().min(1, { message: 'שדה חובה' }),
  surrender_circumstances: z.string().min(1, { message: 'שדה חובה' }),
  vet_clinic: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.has_other_pets && (!data.other_pets_desc || data.other_pets_desc.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'אנא פרטו על בעלי החיים הנוספים בביתכם',
      path: ['other_pets_desc'],
    })
  }
})

export type QuestionnaireInput = z.infer<typeof questionnaireSchema>
