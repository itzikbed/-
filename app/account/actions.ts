'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteAccountAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: 'משתמש לא מחובר' }
  }

  const supabaseAdmin = createAdminClient()

  try {
    // 1. Fetch all cats owned by the user
    const { data: cats, error: catsErr } = await supabaseAdmin
      .from('cats')
      .select('id')
      .eq('owner_id', user.id)

    if (catsErr) {
      console.error('Failed to fetch user cats for deletion:', catsErr.message)
      return { ok: false, error: 'אירעה שגיאה במחיקת החשבון.' }
    }

    // 2. Delete all storage files for each cat
    if (cats && cats.length > 0) {
      for (const cat of cats) {
        // List files in the cat's folder
        const { data: files } = await supabaseAdmin.storage
          .from('cat-photos')
          .list(cat.id)
        
        if (files && files.length > 0) {
          const filePaths = files.map(f => `${cat.id}/${f.name}`)
          const { error: removeStorageErr } = await supabaseAdmin.storage
            .from('cat-photos')
            .remove(filePaths)
          if (removeStorageErr) {
            console.error(`Failed to remove storage files for cat ${cat.id}:`, removeStorageErr.message)
          }
        }
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
