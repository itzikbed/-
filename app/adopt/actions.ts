'use server'

import { createClient as createServerClient } from '@/lib/supabase/server'
import { questionnaireSchema, QuestionnaireInput, questionnaireBaseSchema } from '@/lib/schemas/questionnaire'
import { Database } from '@/lib/supabase/database.types'
import { revalidatePath } from 'next/cache'

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; formError?: string; fieldErrors?: Record<string, string[]> }

export async function saveQuestionnaireStepAction(
  data: QuestionnaireInput,
  isFinal: boolean
): Promise<ActionResult> {
  const supabase = await createServerClient()

  // 1. Recheck authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { ok: false, formError: 'משתמש לא מחובר' }
  }

  // 2. Parse/validate inputs using questionnaireSchema or questionnaireBaseSchema.partial()
  const schema = isFinal ? questionnaireSchema : questionnaireBaseSchema.partial()
  
  // Strip empty strings from data when doing partial validation to allow optional fields
  const dataToValidate = { ...data }
  if (!isFinal) {
    for (const key in dataToValidate) {
      if (dataToValidate[key as keyof typeof dataToValidate] === '') {
        delete dataToValidate[key as keyof typeof dataToValidate]
      }
    }
  }
  
  const result = schema.safeParse(dataToValidate)

  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors
    return { ok: false, fieldErrors }
  }

  // 3. Prepare upsert fields
  const validated = result.data
  const updateData: Database['public']['Tables']['adopter_profiles']['Insert'] = {
    user_id: user.id,
    age: validated.age,
    city: validated.city,
    household_desc: validated.household_desc,
    has_other_pets: validated.has_other_pets,
    other_pets_desc: validated.other_pets_desc,
    has_cat_experience: validated.has_cat_experience,
    floor_type: validated.floor_type,
    has_window_screens: validated.has_window_screens,
    adoption_reason: validated.adoption_reason,
    surrender_circumstances: validated.surrender_circumstances,
    vet_clinic: validated.vet_clinic,
    updated_at: new Date().toISOString(),
  }

  if (isFinal) {
    updateData.completed_at = new Date().toISOString()
  }

  // 4. Upsert to database
  const { error: upsertError } = await supabase
    .from('adopter_profiles')
    .upsert(updateData)

  if (upsertError) {
    console.error('Questionnaire upsert failed:', upsertError.code)
    return { ok: false, formError: 'אירעה שגיאה בשמירת הנתונים. נא לנסות שוב.' }
  }

  revalidatePath('/adopt/questionnaire')
  return { ok: true, data: { success: true } }
}
