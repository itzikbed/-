'use server'

import { createClient } from '@/lib/supabase/server'
import { catSchema, CatInput, draftCatSchema } from '@/lib/schemas/cat'
import { revalidatePath } from 'next/cache'
import { ActionResult } from '@/app/(auth)/actions'
import { strings } from '@/lib/strings'
import { isUuid } from '@/lib/security/media'
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
  const dbName = name || 'טיוטה'
  const dbSex = sex || 'unknown'
  const dbRegion = region || 'center'
  const dbCity = city || 'עיר_זמנית'
  const dbDescription = (description && description.trim().length >= 20)
    ? description
    : 'טיוטה זמנית של תיאור החתול ללא תוכן'

  const dbAgeYears = ageYears ?? 0
  const dbAgeMonths = ageMonths ?? 0
  const birthEst = (ageYears === undefined || ageYears === null || ageMonths === undefined || ageMonths === null)
    ? new Date(2099, 0, 1)
    : new Date(today.getFullYear() - dbAgeYears, today.getMonth() - dbAgeMonths, 15)
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
        name: dbName,
        sex: dbSex,
        birth_est: birthEstStr,
        region: dbRegion,
        city: dbCity,
        description: dbDescription,
        health_notes: health_notes ?? null,
        neutered: neutered ?? false,
        vaccinations: vaccinations ?? 0,
        is_special: is_special ?? false,
        special_needs: special_needs ?? null,
        good_with_cats: good_with_cats ?? null,
        good_with_dogs: good_with_dogs ?? null,
        fee_amount: fee_required ? fee_amount : null,
        status,
        video_path: video_path ?? null
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
        owner_id: userId,
        name: dbName,
        sex: dbSex,
        birth_est: birthEstStr,
        region: dbRegion,
        city: dbCity,
        description: dbDescription,
        health_notes: health_notes ?? null,
        neutered: neutered ?? false,
        vaccinations: vaccinations ?? 0,
        is_special: is_special ?? false,
        special_needs: special_needs ?? null,
        good_with_cats: good_with_cats ?? null,
        good_with_dogs: good_with_dogs ?? null,
        fee_amount: fee_required ? fee_amount : null,
        status,
        video_path: video_path ?? null
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

