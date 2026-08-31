'use server'

import { revalidatePath } from 'next/cache'
import { checkAdmin } from './actions-helper'
import { ActionResult } from './actions'
import { strings } from '@/lib/strings'
import { transitionCat } from '@/lib/cats/transition'
import { isUuid } from '@/lib/security/media'

// Approval, rejection and archival all run through one transactional entry
// point (migration 0018). The status change, the sibling closure, the
// moderation record and the queued notification commit together; delivery
// happens afterwards from email_outbox. checkAdmin stays as the first gate so
// a non-admin never reaches the database at all.

export async function approveCatAction(catId: string): Promise<ActionResult> {
  if (!isUuid(catId)) return { ok: false, formError: strings.admin.conflictError }

  try {
    await checkAdmin()

    const result = await transitionCat(catId, 'published')
    if (!result.ok) return { ok: false, formError: result.formError }

    revalidatePath('/cats')
    revalidatePath('/admin')
    revalidatePath('/')
    return { ok: true }
  } catch {
    return { ok: false, formError: strings.admin.errorOccurred }
  }
}

export async function rejectCatAction(catId: string, reason: string): Promise<ActionResult> {
  reason = reason.trim()
  if (!isUuid(catId) || reason.length < 10 || reason.length > 2000) {
    return { ok: false, formError: strings.admin.dialog.rejectReasonMin }
  }

  try {
    await checkAdmin()

    const result = await transitionCat(catId, 'rejected', reason)
    if (!result.ok) return { ok: false, formError: result.formError }

    revalidatePath('/admin')
    return { ok: true }
  } catch {
    return { ok: false, formError: strings.admin.errorOccurred }
  }
}

export async function archiveCatAdminAction(catId: string, reason: string): Promise<ActionResult> {
  reason = reason.trim()
  if (!isUuid(catId) || reason.length < 10 || reason.length > 2000) {
    return { ok: false, formError: strings.admin.dialog.rejectReasonMin }
  }

  try {
    await checkAdmin()

    const result = await transitionCat(catId, 'archived', reason)
    if (!result.ok) return { ok: false, formError: result.formError }

    revalidatePath('/cats')
    revalidatePath(`/cats/${catId}`)
    revalidatePath('/admin')
    revalidatePath('/')
    return { ok: true }
  } catch {
    return { ok: false, formError: strings.admin.errorOccurred }
  }
}
