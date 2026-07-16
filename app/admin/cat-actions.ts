'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import React from 'react'
import { sendEmail } from '@/lib/emails/send'
import CatApproved, { getSubject as getCatApprovedSub } from '@/emails/CatApproved'
import CatRejected, { getSubject as getCatRejectedSub } from '@/emails/CatRejected'
import CatArchivedByAdmin, { getSubject as getCatArchivedByAdminSub } from '@/emails/CatArchivedByAdmin'
import { checkAdmin, getUserEmail } from './actions-helper'
import { ActionResult } from './actions'
import { strings } from '@/lib/strings'
import { closeSiblings } from '@/lib/requests/close-siblings'
import { isUuid } from '@/lib/security/media'

export async function approveCatAction(catId: string): Promise<ActionResult> {
  if (!isUuid(catId)) return { ok: false, formError: strings.admin.conflictError }

  try {
    const adminId = await checkAdmin()
    const supabase = await createClient()

    const { data: updated, error } = await supabase
      .from('cats')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', catId)
      .eq('status', 'pending')
      .select()

    if (error || !updated || updated.length === 0) {
      return { ok: false, formError: strings.admin.conflictError }
    }

    const cat = updated[0]

    const { error: logErr } = await supabase.from('moderation_log').insert({
      actor_id: adminId,
      entity_type: 'cat',
      entity_id: catId,
      action: 'approve'
    })
    if (logErr) {
      console.error('Failed to insert moderation log:', logErr)
    }

    try {
      const email = await getUserEmail(cat.owner_id)
      await sendEmail({
        to: email,
        subject: getCatApprovedSub(cat.name, cat.sex as 'male' | 'female' | 'unknown'),
        react: React.createElement(CatApproved, { catName: cat.name, catSex: cat.sex as 'male' | 'female' | 'unknown', catId: cat.id }),
        template: 'cat_approved',
        recipientUserId: cat.owner_id,
        catId: cat.id
      })
    } catch (e) {
      console.error('Failed to send cat approval email:', e)
    }

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
    const adminId = await checkAdmin()
    const supabase = await createClient()

    const { data: updated, error } = await supabase
      .from('cats')
      .update({ status: 'rejected', reject_reason: reason })
      .eq('id', catId)
      .eq('status', 'pending')
      .select()

    if (error || !updated || updated.length === 0) {
      return { ok: false, formError: strings.admin.conflictError }
    }

    const cat = updated[0]

    const { error: logErr } = await supabase.from('moderation_log').insert({
      actor_id: adminId,
      entity_type: 'cat',
      entity_id: catId,
      action: 'reject',
      reason
    })
    if (logErr) {
      console.error('Failed to insert moderation log:', logErr)
    }

    try {
      const email = await getUserEmail(cat.owner_id)
      await sendEmail({
        to: email,
        subject: getCatRejectedSub(cat.name, cat.sex as 'male' | 'female' | 'unknown'),
        react: React.createElement(CatRejected, { catName: cat.name, catSex: cat.sex as 'male' | 'female' | 'unknown', reason }),
        template: 'cat_rejected',
        recipientUserId: cat.owner_id,
        catId: cat.id
      })
    } catch (e) {
      console.error('Failed to send cat rejection email:', e)
    }

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
    const adminId = await checkAdmin()
    const supabase = await createClient()

    // Sibling auto-close tail (must run before updating status to not conflict with trigger)
    await closeSiblings(catId)

    const { data: updated, error } = await supabase
      .from('cats')
      .update({ status: 'archived' })
      .eq('id', catId)
      .eq('status', 'published')
      .select()

    if (error || !updated || updated.length === 0) {
      return { ok: false, formError: strings.admin.conflictError }
    }

    const cat = updated[0]

    const { error: logErr } = await supabase.from('moderation_log').insert({
      actor_id: adminId,
      entity_type: 'cat',
      entity_id: catId,
      action: 'archive',
      reason
    })
    if (logErr) {
      console.error('Failed to insert moderation log:', logErr)
    }

    // Fire-and-log email notification to the owner
    try {
      const email = await getUserEmail(cat.owner_id)
      await sendEmail({
        to: email,
        subject: getCatArchivedByAdminSub(cat.name, cat.sex as 'male' | 'female' | 'unknown'),
        react: React.createElement(CatArchivedByAdmin, {
          catName: cat.name,
          catSex: cat.sex as 'male' | 'female' | 'unknown',
          reason
        }),
        template: 'cat_archived_by_admin',
        recipientUserId: cat.owner_id,
        catId: cat.id
      })
    } catch (e) {
      console.error('Failed to send cat admin archival email:', e)
    }

    revalidatePath('/cats')
    revalidatePath(`/cats/${catId}`)
    revalidatePath('/admin')
    revalidatePath('/')
    return { ok: true }
  } catch {
    return { ok: false, formError: strings.admin.errorOccurred }
  }
}
