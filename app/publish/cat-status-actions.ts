'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ActionResult } from '@/app/(auth)/actions'
import { closeSiblings } from '@/lib/requests/close-siblings'
import { strings } from '@/lib/strings'
import {
  getStoredVideoPaths,
  isStoredMediaPath,
  isUuid
} from '@/lib/security/media'

export async function deleteCatAction(catId: string): Promise<ActionResult> {
  if (!isUuid(catId)) return { ok: false, formError: strings.common.errorOccurred }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, formError: 'אנא התחבר תחילה.' }

  const { data: cat } = await supabase.from('cats').select('owner_id, video_path, published_at').eq('id', catId).single()
  if (!cat) return { ok: false, formError: 'המודעה לא נמצאה.' }

  if (cat.owner_id !== user.id) {
    return { ok: false, formError: 'אין לך הרשאה למחוק מודעה זו.' }
  }

  if (cat.published_at !== null) {
    return { ok: false, formError: strings.publish.catPublishedDeleteError }
  }

  // Load photos to delete before database cascade deletes them
  const { data: photos, error: photosError } = await supabase
    .from('cat_photos')
    .select('path_card, path_full')
    .eq('cat_id', catId)

  if (photosError) return { ok: false, formError: strings.publish.catDeleteError }

  // Delete DB row first
  const { data: deletedRows, error: deleteError } = await supabase
    .from('cats')
    .delete()
    .eq('id', catId)
    .select()

  if (deleteError || !deletedRows || deletedRows.length !== 1) {
    return { ok: false, formError: strings.publish.catDeleteError }
  }

  // Remove storage files (non-fatal if it fails)
  const filesToDelete: string[] = []
  if (photos) photos.forEach((photo) => filesToDelete.push(photo.path_card, photo.path_full))
  if (cat.video_path) filesToDelete.push(...getStoredVideoPaths(cat.video_path))

  const safeFilesToDelete = filesToDelete.filter((path) =>
    path.toLowerCase().startsWith(`${catId.toLowerCase()}/`) && isStoredMediaPath(path)
  )

  if (safeFilesToDelete.length > 0) {
    const storageAdmin = createAdminClient()
    const { error: storageError } = await storageAdmin.storage
      .from('cat-photos')
      .remove(safeFilesToDelete)
    if (storageError) console.error('Storage cleanup failed after cat deletion:', storageError.message)
  }

  revalidatePath('/publish/my-cats')
  revalidatePath('/cats')
  return { ok: true, data: { success: true } }
}

export async function markAsAdoptedAction(catId: string): Promise<ActionResult> {
  if (!isUuid(catId)) return { ok: false, formError: strings.common.errorOccurred }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, formError: 'אנא התחבר תחילה.' }

  const { data: cat } = await supabase.from('cats').select('owner_id').eq('id', catId).single()
  if (!cat) return { ok: false, formError: 'החתול לא נמצא.' }

  if (cat.owner_id !== user.id) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') {
      return { ok: false, formError: 'אין לך הרשאה לעדכן מודעה זו.' }
    }
  }

  // Auto-close sibling requests first
  await closeSiblings(catId)

  const { data: updated, error } = await supabase
    .from('cats')
    .update({ status: 'adopted', adopted_at: new Date().toISOString() })
    .eq('id', catId)
    .eq('status', 'published')
    .select()

  if (error || !updated || updated.length === 0) {
    return { ok: false, formError: strings.admin.conflictError }
  }

  revalidatePath('/publish/my-cats')
  revalidatePath('/cats')
  revalidatePath(`/cats/${catId}`)
  revalidatePath('/')
  return { ok: true, data: { success: true } }
}

export async function archiveCatAction(catId: string): Promise<ActionResult> {
  if (!isUuid(catId)) return { ok: false, formError: strings.common.errorOccurred }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, formError: 'אנא התחבר תחילה.' }

  const { data: cat } = await supabase.from('cats').select('owner_id').eq('id', catId).single()
  if (!cat) return { ok: false, formError: 'החתול לא נמצא.' }

  if (cat.owner_id !== user.id) {
    return { ok: false, formError: 'אין לך הרשאה לעדכן מודעה זו.' }
  }

  // Auto-close sibling requests first
  await closeSiblings(catId)

  const { data: updated, error } = await supabase
    .from('cats')
    .update({ status: 'archived' })
    .eq('id', catId)
    .in('status', ['published', 'adopted'])
    .select()

  if (error || !updated || updated.length === 0) {
    return { ok: false, formError: strings.admin.conflictError }
  }

  revalidatePath('/publish/my-cats')
  revalidatePath('/cats')
  revalidatePath(`/cats/${catId}`)
  revalidatePath('/')
  return { ok: true, data: { success: true } }
}
