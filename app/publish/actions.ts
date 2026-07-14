'use server'

import { createClient } from '@/lib/supabase/server'
import { publisherApplicationSchema, PublisherApplicationInput } from '@/lib/schemas/publisher'
import { catSchema, CatInput } from '@/lib/schemas/cat'
import { revalidatePath } from 'next/cache'
import { ActionResult } from '@/app/(auth)/actions'
import { z } from 'zod'

// Helper to check user status and retrieve user profile
async function checkApprovedPublisher(): Promise<{ ok: boolean; error?: string; userId?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: 'אנא התחבר תחילה.' }
  }

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
    return { ok: false, formError: 'אירעה שגיאה בשמירת הבקשה: ' + error.message }
  }

  revalidatePath('/publish')
  return { ok: true, data: { success: true } }
}

export async function upsertCatAction(
  formData: any,
  catId?: string,
  isDraft = false
): Promise<ActionResult<{ catId: string }>> {
  const check = await checkApprovedPublisher()
  if (!check.ok) {
    return { ok: false, formError: check.error }
  }
  const userId = check.userId!

  // Validate using catSchema
  const result = catSchema.safeParse(formData)
  if (!result.success) {
    return { ok: false, fieldErrors: result.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const {
    name,
    sex,
    ageYears,
    ageMonths,
    vaccinations,
    neutered,
    health_notes,
    is_special,
    special_needs,
    good_with_cats,
    good_with_dogs,
    fee_required,
    fee_amount,
    description,
    region,
    city,
    photos,
    video_path
  } = result.data

  // Compute birth_est
  const today = new Date()
  const birthEst = new Date(today.getFullYear() - ageYears, today.getMonth() - ageMonths, 15)
  const birthEstStr = birthEst.toISOString().split('T')[0]

  // Decide status
  // If isDraft is true, save as 'draft'.
  // Otherwise, set to 'pending'.
  const status = isDraft ? 'draft' : 'pending'

  let targetId = catId

  if (targetId) {
    // Check ownership
    const { data: existingCat } = await supabase
      .from('cats')
      .select('owner_id, status')
      .eq('id', targetId)
      .single()

    if (!existingCat) {
      return { ok: false, formError: 'החתול לא נמצא.' }
    }

    if (existingCat.owner_id !== userId) {
      // Check if admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()
      if (!profile || profile.role !== 'admin') {
        return { ok: false, formError: 'אין לך הרשאה לערוך חתול זה.' }
      }
    }

    // Update cat listing
    const { error: updateError } = await supabase
      .from('cats')
      .update({
        name,
        sex,
        birth_est: birthEstStr,
        region,
        city,
        description,
        health_notes,
        neutered,
        vaccinations,
        is_special,
        special_needs,
        good_with_cats,
        good_with_dogs,
        fee_amount: fee_required ? fee_amount : null,
        status,
        video_path
      })
      .eq('id', targetId)

    if (updateError) {
      return { ok: false, formError: 'שגיאה בעדכון החתול: ' + updateError.message }
    }
  } else {
    // Insert new cat listing
    const { data: inserted, error: insertError } = await supabase
      .from('cats')
      .insert({
        owner_id: userId,
        name,
        sex,
        birth_est: birthEstStr,
        region,
        city,
        description,
        health_notes,
        neutered,
        vaccinations,
        is_special,
        special_needs,
        good_with_cats,
        good_with_dogs,
        fee_amount: fee_required ? fee_amount : null,
        status,
        video_path
      })
      .select('id')
      .single()

    if (insertError || !inserted) {
      return { ok: false, formError: 'שגיאה ביצירת החתול: ' + (insertError?.message || 'לא התקבל מזהה') }
    }

    targetId = inserted.id
  }

  // Update cat photos
  // First delete old photos from DB (does not delete from storage to save cost if they are still referenced,
  // but wait, we want to keep storage clean. The sequential uploader cleans up unused files,
  // or we can sync it. Let's delete the database entries and insert the new ones.)
  const { error: deletePhotosError } = await supabase
    .from('cat_photos')
    .delete()
    .eq('cat_id', targetId)

  if (deletePhotosError) {
    return { ok: false, formError: 'שגיאה בעדכון תמונות: ' + deletePhotosError.message }
  }

  if (photos && photos.length > 0) {
    const photosToInsert = photos.map((p, index) => ({
      cat_id: targetId!,
      path_card: p.path_card,
      path_full: p.path_full,
      sort_order: p.sort_order
    }))

    const { error: insertPhotosError } = await supabase
      .from('cat_photos')
      .insert(photosToInsert)

    if (insertPhotosError) {
      return { ok: false, formError: 'שגיאה בשמירת תמונות: ' + insertPhotosError.message }
    }
  }

  revalidatePath('/publish/my-cats')
  revalidatePath('/cats')
  revalidatePath(`/cats/${targetId}`)
  return { ok: true, data: { catId: targetId } }
}

export async function deleteCatAction(catId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, formError: 'אנא התחבר תחילה.' }
  }

  const { data: cat } = await supabase
    .from('cats')
    .select('owner_id, video_path')
    .eq('id', catId)
    .single()

  if (!cat) {
    return { ok: false, formError: 'המודעה לא נמצאה.' }
  }

  // Verify ownership or admin role
  if (cat.owner_id !== user.id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (!profile || profile.role !== 'admin') {
      return { ok: false, formError: 'אין לך הרשאה למחוק מודעה זו.' }
    }
  }

  // Fetch all photos to delete from storage
  const { data: photos } = await supabase
    .from('cat_photos')
    .select('path_card, path_full')
    .eq('cat_id', catId)

  // Remove files from storage
  const filesToDelete: string[] = []
  if (photos) {
    photos.forEach(p => {
      filesToDelete.push(p.path_card)
      filesToDelete.push(p.path_full)
    })
  }
  if (cat.video_path) {
    filesToDelete.push(cat.video_path)
  }

  if (filesToDelete.length > 0) {
    await supabase.storage
      .from('cat-photos')
      .remove(filesToDelete)
  }

  // Delete cat row (DB cascade will delete cat_photos rows)
  const { error } = await supabase
    .from('cats')
    .delete()
    .eq('id', catId)

  if (error) {
    return { ok: false, formError: 'שגיאה במחיקת המודעה: ' + error.message }
  }

  revalidatePath('/publish/my-cats')
  revalidatePath('/cats')
  return { ok: true, data: { success: true } }
}

export async function markAsAdoptedAction(catId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, formError: 'אנא התחבר תחילה.' }
  }

  const { data: cat } = await supabase
    .from('cats')
    .select('owner_id')
    .eq('id', catId)
    .single()

  if (!cat) {
    return { ok: false, formError: 'החתול לא נמצא.' }
  }

  if (cat.owner_id !== user.id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (!profile || profile.role !== 'admin') {
      return { ok: false, formError: 'אין לך הרשאה לעדכן מודעה זו.' }
    }
  }

  const { error } = await supabase
    .from('cats')
    .update({
      status: 'adopted',
      adopted_at: new Date().toISOString()
    })
    .eq('id', catId)

  if (error) {
    return { ok: false, formError: 'שגיאה בעדכון סטטוס החתול: ' + error.message }
  }

  revalidatePath('/publish/my-cats')
  revalidatePath('/cats')
  revalidatePath(`/cats/${catId}`)
  return { ok: true, data: { success: true } }
}
