'use server'

import { createClient } from '@/lib/supabase/server'
import { adoptionRequestSchema, AdoptionRequestInput } from '@/lib/schemas/request'
import { revalidatePath } from 'next/cache'
import React from 'react'
import { sendEmail } from '@/lib/emails/send'
import RequestReceived, { getSubject as getReqReceivedSub } from '@/emails/RequestReceived'
import { isUuid } from '@/lib/security/media'

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

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count, error: countErr } = await supabase
    .from('adoption_requests')
    .select('id', { count: 'exact', head: true })
    .eq('adopter_id', user.id)
    .gt('created_at', oneDayAgo)

  if (countErr) {
    return { ok: false, formError: 'אירעה שגיאה בבדיקת מגבלת הבקשות.' }
  }

  if (count !== null && count >= 5) {
    return { ok: false, formError: 'הגעת למגבלת הבקשות היומית (מקסימום 5 בקשות ב-24 שעות).' }
  }

  const { count: openCount, error: openCountErr } = await supabase
    .from('adoption_requests')
    .select('id', { count: 'exact', head: true })
    .eq('adopter_id', user.id)
    .eq('status', 'pending')

  if (openCountErr) {
    return { ok: false, formError: 'אירעה שגיאה בבדיקת מגבלת הבקשות.' }
  }

  if (openCount !== null && openCount >= 3) {
    return { ok: false, formError: 'ניתן להחזיק עד 3 בקשות אימוץ ממתינות במקביל. ניתן לבטל בקשה קיימת או להמתין להחלטת המנהלים.' }
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
    .select('name, sex, status')
    .eq('id', catId)
    .single()

  if (catErr || !cat || cat.status !== 'published') {
    return { ok: false, formError: 'החתול אינו זמין לאימוץ כרגע' }
  }

  const { data: inserted, error: insertErr } = await supabase
    .from('adoption_requests')
    .insert({
      adopter_id: user.id,
      cat_id: catId,
      message,
      status: 'pending'
    })
    .select('id')
    .single()

  if (insertErr || !inserted) {
    if (insertErr?.code === '23505') {
      return { ok: false, formError: 'כבר שלחת בקשת אימוץ לחתול זה, והיא ממתינה לטיפול.' }
    }
    return { ok: false, formError: 'אירעה שגיאה בשליחת הבקשה. אנא נסה שנית.' }
  }

  // Send confirmation email to adopter
  if (user.email) {
    try {
      await sendEmail({
        to: user.email,
        subject: getReqReceivedSub(cat.name, cat.sex as 'male' | 'female' | 'unknown'),
        react: React.createElement(RequestReceived, { catName: cat.name, catSex: cat.sex as 'male' | 'female' | 'unknown' }),
        template: 'request_received',
        recipientUserId: user.id,
        catId,
        requestId: inserted.id
      })
    } catch (e) {
      console.error('[REQUEST EMAIL] send failed:', e instanceof Error ? e.message : String(e))
    }
  }

  revalidatePath('/requests')
  revalidatePath(`/cats/${catId}`)

  return { ok: true, data: { success: true } }
}

export async function withdrawAdoptionRequestAction(requestId: string): Promise<ActionResult> {
  if (!isUuid(requestId)) return { ok: false, formError: 'הבקשה לא נמצאה' }

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
