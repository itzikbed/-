import { z } from 'zod'
import { initHebrewValidation } from './he-errors'

initHebrewValidation()

export const catBaseSchema = z.object({
  // Step 1: Details
  name: z.string().trim().min(1, { message: 'שם החתול חובה' }).max(40, { message: 'שם החתול ארוך מדי' }),
  sex: z.enum(['male', 'female', 'unknown'], { message: 'נא לבחור מין' }),
  ageYears: z.number().int().min(0).max(25),
  ageMonths: z.number().int().min(0).max(11),

  // Step 2: Health
  vaccinations: z.number().int().min(0).max(3),
  neutered: z.boolean(),
  health_notes: z.string().max(3000).optional().nullable(),
  is_special: z.boolean(),
  special_needs: z.string().max(2000).optional().nullable(),

  // Step 3: Character
  good_with_cats: z.boolean().nullable().optional(),
  good_with_dogs: z.boolean().nullable().optional(),
  fee_required: z.boolean(),
  fee_amount: z.number().int().max(10000).optional().nullable(),
  description: z.string().trim().min(20, { message: 'תיאור החתול חייב להכיל לפחות 20 תווים' }).max(5000),
  region: z.enum(['north', 'south', 'center', 'jerusalem', 'yosh'], { message: 'נא לבחור אזור' }),
  city: z.string().trim().min(1, { message: 'שדה חובה' }).max(100),
  
  // Step 4: Photos (paths returned from pipeline)
  photos: z.array(z.object({
    path_card: z.string().max(180),
    path_full: z.string().max(180),
    sort_order: z.number().int().min(0).max(5)
  })).min(1, { message: 'יש להעלות לפחות תמונה אחת' }).max(6),
  
  // Optional video path
  video_path: z.string().max(180).optional().nullable()
})

const ageSpecialRefine = (
  data: {
    ageYears: number
    ageMonths: number
    is_special: boolean
    special_needs?: string | null
    fee_required: boolean
    fee_amount?: number | null
  },
  ctx: z.RefinementCtx
) => {
  // Check age is not zero
  if (data.ageYears === 0 && data.ageMonths === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'גיל החתול אינו יכול להיות 0',
      path: ['ageYears']
    })
  }
  // Check special needs description if special is true
  if (data.is_special && (!data.special_needs || data.special_needs.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'נא לפרט את הצרכים המיוחדים של החתול',
      path: ['special_needs']
    })
  }
  // Check fee amount if fee required is true
  if (data.fee_required && (!data.fee_amount || data.fee_amount <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'נא להזין סכום סל אימוץ תקין (גבוה מ-0)',
      path: ['fee_amount']
    })
  }
}

export const catSchema = catBaseSchema.superRefine(ageSpecialRefine)

export const draftCatSchema = catBaseSchema.extend({
  photos: z.array(z.object({
    path_card: z.string().max(180),
    path_full: z.string().max(180),
    sort_order: z.number().int().min(0).max(5)
  })).max(6)
}).superRefine(ageSpecialRefine)

export type CatInput = z.infer<typeof catSchema>
