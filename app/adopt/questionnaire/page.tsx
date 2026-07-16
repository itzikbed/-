import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { QuestionnaireInput } from '@/lib/schemas/questionnaire'
import QuestionnaireWizard from './QuestionnaireWizard'

export default async function QuestionnairePage() {
  const supabase = await createClient()

  // 1. Recheck authentication on server
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // 2. Fetch existing adopter profile
  const { data: profile } = await supabase
    .from('adopter_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  const isCompletedInitially = !!profile?.completed_at

  // 3. Construct defaultValues with all keys
  const defaultValues: Partial<QuestionnaireInput> = {
    age: profile?.age ?? undefined,
    city: profile?.city ?? '',
    household_desc: profile?.household_desc ?? '',
    has_other_pets: profile?.has_other_pets ?? false,
    other_pets_desc: profile?.other_pets_desc ?? '',
    has_cat_experience: profile?.has_cat_experience ?? false,
    floor_type: (profile?.floor_type as QuestionnaireInput['floor_type'] | null) || undefined,
    has_window_screens: profile?.has_window_screens ?? false,
    adoption_reason: profile?.adoption_reason ?? '',
    surrender_circumstances: profile?.surrender_circumstances ?? '',
    vet_clinic: profile?.vet_clinic ?? '',
  }

  return (
    <div className="flex-grow py-12 px-4 md:px-8 bg-paper">
      <div className="app-container max-w-3xl mx-auto">
        <QuestionnaireWizard
          defaultValues={defaultValues}
          isCompletedInitially={isCompletedInitially}
        />
      </div>
    </div>
  )
}