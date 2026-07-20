'use server'

import { createClient } from '@/lib/supabase/server'
import { publisherApplicationSchema, PublisherApplicationInput } from '@/lib/schemas/publisher'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ActionResult } from '@/app/(auth)/actions'

export async function activateAdminPublisherAccessAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/publish')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, publisher_status')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/publish')
  }

  if (profile.publisher_status === 'approved') {
    redirect('/publish/my-cats')
  }

  if (profile.publisher_status !== 'none' && profile.publisher_status !== 'pending') {
    redirect('/publish')
  }

  const { data: granted, error } = await supabase
    .from('profiles')
    .update({ publisher_status: 'approved' })
    .eq('id', user.id)
    .eq('role', 'admin')
    .in('publisher_status', ['none', 'pending'])
    .select('id')
    .maybeSingle()

  if (error || !granted) {
    throw new Error('Failed to activate admin publisher access')
  }

  const { error: logError } = await supabase.from('moderation_log').insert({
    actor_id: user.id,
    entity_type: 'publisher',
    entity_id: user.id,
    action: 'approve'
  })

  if (logError) {
    console.error('Failed to insert moderation log:', logError.code)
  }

  revalidatePath('/publish')
  redirect('/publish/my-cats')
}

export async function applyAsPublisherAction(formData: PublisherApplicationInput): Promise<ActionResult> {
  const result = publisherApplicationSchema.safeParse(formData)
  if (!result.success) {
    return { ok: false, fieldErrors: result.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, formError: 'אנא התחבר כדי להגיש בקשה.' }
  }

  const { fullName, phone, age, publisherType, region, city } = result.data

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: fullName,
      phone,
      age,
      publisher_type: publisherType,
      region,
      city,
      publisher_status: 'pending'
    })
    .eq('id', user.id)

  if (error) {
    console.error('Publisher application update failed:', error.code)
    return { ok: false, formError: 'אירעה שגיאה בשמירת הבקשה. נא לנסות שוב.' }
  }

  revalidatePath('/publish')
  return { ok: true, data: { success: true } }
}
