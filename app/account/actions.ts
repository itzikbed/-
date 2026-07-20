'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { strings } from '@/lib/strings'

// Remove every stored file under the cat's folder and verify the folder is
// actually empty afterwards (one retry). Returns false when files remain, so
// the caller can abort instead of over-promising deletion.
async function purgeCatMedia(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  catId: string
): Promise<boolean> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const { data: files, error: listErr } = await supabaseAdmin.storage
      .from('cat-photos')
      .list(catId)
    if (listErr) {
      console.error(`Failed to list storage for cat ${catId}:`, listErr.message)
      return false
    }
    if (!files || files.length === 0) return true

    const filePaths = files.map((f) => `${catId}/${f.name}`)
    const { error: removeErr } = await supabaseAdmin.storage
      .from('cat-photos')
      .remove(filePaths)
    if (removeErr) {
      console.error(`Failed to remove storage files for cat ${catId}:`, removeErr.message)
    }
  }

  const { data: remaining } = await supabaseAdmin.storage.from('cat-photos').list(catId)
  return !remaining || remaining.length === 0
}

export async function deleteAccountAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: 'משתמש לא מחובר' }
  }

  const supabaseAdmin = createAdminClient()

  try {
    // Admin accounts are referenced by moderation_log (FK without cascade) —
    // deletion would fail mid-way. Block up front with an honest explanation.
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role === 'admin') {
      return { ok: false, error: strings.account.adminDeleteBlocked }
    }

    // 1. Fetch all cats owned by the user
    const { data: cats, error: catsErr } = await supabaseAdmin
      .from('cats')
      .select('id')
      .eq('owner_id', user.id)

    if (catsErr) {
      console.error('Failed to fetch user cats for deletion:', catsErr.message)
      return { ok: false, error: 'אירעה שגיאה במחיקת החשבון.' }
    }

    // 2. Delete all storage files for each cat, verifying the buckets are
    // really empty — the on-screen promise depends on it. Abort otherwise.
    for (const cat of cats ?? []) {
      const purged = await purgeCatMedia(supabaseAdmin, cat.id)
      if (!purged) {
        return { ok: false, error: strings.account.mediaDeleteFailed }
      }
    }

    // 3. Delete the auth user (this will cascade delete profiles, adopter_profiles, cats, requests, etc. in Postgres!)
    const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    if (deleteErr) {
      console.error('Failed to delete auth user:', deleteErr.message)
      return { ok: false, error: 'אירעה שגיאה במחיקת החשבון במערכת האימות.' }
    }

    // Sign out and revalidate
    revalidatePath('/', 'layout')
    return { ok: true }
  } catch (err) {
    console.error('Account deletion exception:', err)
    return { ok: false, error: 'אירעה שגיאה לא צפויה במחיקת החשבון.' }
  }
}
