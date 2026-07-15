'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { catSchema, CatInput, draftCatSchema } from '@/lib/schemas/cat'
import { revalidatePath } from 'next/cache'
import { ActionResult } from '@/app/(auth)/actions'
import { closeSiblings } from '@/lib/requests/close-siblings'
import { strings } from '@/lib/strings'
import {
  getStoredVideoPaths,
  isStoredMediaPath,
  isUuid
} from '@/lib/security/media'
import { validateCatMedia } from '@/lib/security/verify-stored-media'

async function checkApprovedPublisher(): Promise<{ ok: boolean; error?: string; userId?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'אנא התחבר תחילה.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('publisher_status')
    .eq('id', user.id)
    .single()

  if (!profile || profile.publisher_status !== 'approved') {
    return { ok: false, error: 'חשבון מוסר אינו מאושר.' }
  }
  return { ok: true, userId: user.id }
}

export async function upsertCatAction(
  formData: CatInput,
  catId?: string,
  isDraft = false
): Promise<ActionResult<{ catId: string }>> {
  if (catId && !isUuid(catId)) {
    return { ok: false, formError: strings.common.errorOccurred }
  }

  const check = await checkApprovedPublisher()
  if (!check.ok) return { ok: false, formError: check.error }
  const userId = check.userId!

  const schemaToUse = isDraft ? draftCatSchema : catSchema
  const result = schemaToUse.safeParse(formData)
  if (!result.success) {
    return { ok: false, fieldErrors: result.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const {
    name, sex, ageYears, ageMonths, vaccinations, neutered, health_notes,
    is_special, special_needs, good_with_cats, good_with_dogs, fee_required,
    fee_amount, description, region, city, photos, video_path
  } = result.data

  const today = new Date()
  const birthEst = new Date(today.getFullYear() - ageYears, today.getMonth() - ageMonths, 15)
  const birthEstStr = birthEst.toISOString().split('T')[0]
  const requestedStatus = isDraft ? 'draft' : 'pending'
  let targetId = catId

  if (targetId) {
    const { data: existingCat } = await supabase.from('cats').select('owner_id, status').eq('id', targetId).single()
    if (!existingCat) return { ok: false, formError: 'החתול לא נמצא.' }

    if (existingCat.owner_id !== userId) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single()
      if (!profile || profile.role !== 'admin') {
        return { ok: false, formError: 'אין לך הרשאה לערוך חתול זה.' }
      }
    }

    if (!(await validateCatMedia(supabase, photos || [], video_path, targetId))) {
      return { ok: false, formError: strings.common.errorOccurred }
    }

    const status = existingCat.status === 'published' ? 'pending' : requestedStatus
    const { error: updateError } = await supabase
      .from('cats')
      .update({
        name, sex, birth_est: birthEstStr, region, city, description, health_notes,
        neutered, vaccinations, is_special, special_needs, good_with_cats,
        good_with_dogs, fee_amount: fee_required ? fee_amount : null, status, video_path
      })
      .eq('id', targetId)

    if (updateError) {
      console.error('Cat update failed:', updateError.code)
      return { ok: false, formError: strings.common.errorOccurred }
    }
  } else {
    if ((photos && photos.length > 0) || video_path) {
      return { ok: false, formError: strings.common.errorOccurred }
    }

    const status = requestedStatus
    const { data: inserted, error: insertError } = await supabase
      .from('cats')
      .insert({
        owner_id: userId, name, sex, birth_est: birthEstStr, region, city, description,
        health_notes, neutered, vaccinations, is_special, special_needs, good_with_cats,
        good_with_dogs, fee_amount: fee_required ? fee_amount : null, status, video_path
      })
      .select('id')
      .single()

    if (insertError || !inserted) {
      console.error('Cat insert failed:', insertError?.code)
      return { ok: false, formError: strings.common.errorOccurred }
    }
    targetId = inserted.id
  }

  const { error: deletePhotosError } = await supabase.from('cat_photos').delete().eq('cat_id', targetId)
  if (deletePhotosError) {
    console.error('Cat photo metadata cleanup failed:', deletePhotosError.code)
    return { ok: false, formError: strings.common.errorOccurred }
  }

  if (photos && photos.length > 0) {
    const photosToInsert = photos.map((p) => ({
      cat_id: targetId!,
      path_card: p.path_card,
      path_full: p.path_full,
      sort_order: p.sort_order
    }))

    const { error: insertPhotosError } = await supabase.from('cat_photos').insert(photosToInsert)
    if (insertPhotosError) {
      console.error('Cat photo metadata insert failed:', insertPhotosError.code)
      return { ok: false, formError: strings.common.errorOccurred }
    }
  }

  revalidatePath('/publish/my-cats')
  revalidatePath('/cats')
  revalidatePath(`/cats/${targetId}`)
  return { ok: true, data: { catId: targetId } }
}

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

  const { data: updated, error } = await supabase
    .from('cats')
    .update({ status: 'adopted', adopted_at: new Date().toISOString() })
    .eq('id', catId)
    .eq('status', 'published')
    .select()

  if (error || !updated || updated.length === 0) {
    return { ok: false, formError: strings.admin.conflictError }
  }

  // Auto-close sibling requests
  await closeSiblings(catId)

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

  const { data: updated, error } = await supabase
    .from('cats')
    .update({ status: 'archived' })
    .eq('id', catId)
    .in('status', ['published', 'adopted'])
    .select()

  if (error || !updated || updated.length === 0) {
    return { ok: false, formError: strings.admin.conflictError }
  }

  // Auto-close sibling requests
  await closeSiblings(catId)

  revalidatePath('/publish/my-cats')
  revalidatePath('/cats')
  revalidatePath(`/cats/${catId}`)
  revalidatePath('/')
  return { ok: true, data: { success: true } }
}
