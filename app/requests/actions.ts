'use server'

import { createClient } from '@/lib/supabase/server'
import { adoptionRequestSchema, AdoptionRequestInput } from '@/lib/schemas/request'
import { revalidatePath } from 'next/cache'

export type ActionResult<T = unknown> = 
  | { ok: true; data?: T }
  | { ok: false; formError?: string; fieldErrors?: Record<string, string[]> }

export async function submitAdoptionRequestAction(data: AdoptionRequestInput): Promise<ActionResult> {
  const parsed = adoptionRequestSchema.safeParse(data)
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors
    }
  }

  const { catId, message } = parsed.data
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, formError: 'יש להתחבר כדי לשלוח בקשת אימוץ' }
  }

  const { data: profile, error: profileErr } = await supabase
    .from('adopter_profiles')
    .select('completed_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profileErr || !profile || !profile.completed_at) {
    return { ok: false, formError: 'יש למלא את שאלון המאמץ תחילה' }
  }

  const { data: existingRequest } = await supabase
    .from('adoption_requests')
    .select('id')
    .eq('cat_id', catId)
    .eq('adopter_id', user.id)
    .eq('status', 'pending')
    .maybeSingle()

  if (existingRequest) {
    return { ok: false, formError: 'כבר שלחת בקשת אימוץ לחתול זה, והיא ממתינה לטיפול.' }
  }

  const { data: cat, error: catErr } = await supabase
    .from('cats')
    .select('status')
    .eq('id', catId)
    .single()

  if (catErr || !cat || cat.status !== 'published') {
    return { ok: false, formError: 'החתול אינו זמין לאימוץ כרגע' }
  }

  const { error: insertErr } = await supabase
    .from('adoption_requests')
    .insert({
      adopter_id: user.id,
      cat_id: catId,
      message,
      status: 'pending'
    })

  if (insertErr) {
    if (insertErr.code === '23505') {
      return { ok: false, formError: 'כבר שלחת בקשת אימוץ לחתול זה, והיא ממתינה לטיפול.' }
    }
    return { ok: false, formError: 'אירעה שגיאה בשליחת הבקשה. אנא נסה שנית.' }
  }

  // TODO(phase4): send confirmation email 'request-received'

  revalidatePath('/requests')
  revalidatePath(`/cats/${catId}`)

  return { ok: true, data: { success: true } }
}

export async function withdrawAdoptionRequestAction(requestId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, formError: 'יש להתחבר כדי לבצע פעולה זו' }
  }

  const { data: req, error: reqErr } = await supabase
    .from('adoption_requests')
    .select('*, cats(owner_id)')
    .eq('id', requestId)
    .single()

  if (reqErr || !req) {
    return { ok: false, formError: 'הבקשה לא נמצאה' }
  }

  const catOwnerId = (req.cats as unknown as { owner_id: string } | null)?.owner_id
  const isAdopter = req.adopter_id === user.id
  const isUploader = catOwnerId === user.id

  if (!isAdopter && !isUploader) {
    return { ok: false, formError: 'אין הרשאה לבצע פעולה זו' }
  }

  const { error: updateErr } = await supabase
    .from('adoption_requests')
    .update({ status: 'withdrawn' })
    .eq('id', requestId)

  if (updateErr) {
    return { ok: false, formError: 'אירעה שגיאה בביטול הבקשה' }
  }

  revalidatePath('/requests')
  if (req.cat_id) {
    revalidatePath(`/cats/${req.cat_id}`)
  }

  return { ok: true, data: { success: true } }
}