'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ActionResult } from '@/app/(auth)/actions'
import { strings } from '@/lib/strings'
import { isUuid } from '@/lib/security/media'

// Storage RLS (migration 0011) freezes a published cat's media for its owner,
// so the wizard offers an explicit, confirmed unpublish step before media
// edits. This can only ever move published → pending — the same transition the
// edit-submit performs anyway (and the only one guard_cat_owner_mutation
// permits an owner from 'published').
export async function unpublishForMediaEditAction(catId: string): Promise<ActionResult> {
  if (!isUuid(catId)) return { ok: false, formError: strings.common.errorOccurred }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, formError: 'אנא התחבר תחילה.' }

  const { data: cat } = await supabase
    .from('cats')
    .select('owner_id, status')
    .eq('id', catId)
    .single()
  if (!cat) return { ok: false, formError: 'החתול לא נמצא.' }

  if (cat.owner_id !== user.id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (!profile || profile.role !== 'admin') {
      return { ok: false, formError: 'אין לך הרשאה לערוך מודעה זו.' }
    }
  }

  const { data: updated, error } = await supabase
    .from('cats')
    .update({ status: 'pending' })
    .eq('id', catId)
    .eq('status', 'published')
    .select()

  if (error || !updated || updated.length === 0) {
    return { ok: false, formError: strings.admin.conflictError }
  }

  revalidatePath('/')
  revalidatePath('/cats')
  revalidatePath(`/cats/${catId}`)
  revalidatePath('/publish/my-cats')
  return { ok: true, data: { success: true } }
}
