'use server'

import { createClient } from '@/lib/supabase/server'
import { publisherApplicationSchema, PublisherApplicationInput } from '@/lib/schemas/publisher'
import { revalidatePath } from 'next/cache'
import { ActionResult } from '@/app/(auth)/actions'

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
