'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import React from 'react'
import { sendEmail } from '@/lib/emails/send'
import PublisherApproved, { getSubject as getPubApprovedSub } from '@/emails/PublisherApproved'
import { checkAdmin, getUserEmail } from './actions-helper'
import { ActionResult } from './actions'
import { strings } from '@/lib/strings'
import { isUuid } from '@/lib/security/media'

export async function approvePublisherAction(publisherId: string): Promise<ActionResult> {
  if (!isUuid(publisherId)) return { ok: false, formError: strings.admin.conflictError }

  try {
    const adminId = await checkAdmin()
    const supabase = await createClient()

    const { data: updated, error } = await supabase
      .from('profiles')
      .update({ publisher_status: 'approved' })
      .eq('id', publisherId)
      .eq('publisher_status', 'pending')
      .select()

    if (error || !updated || updated.length === 0) {
      return { ok: false, formError: strings.admin.conflictError }
    }

    const publisher = updated[0]

    const { error: logErr } = await supabase.from('moderation_log').insert({
      actor_id: adminId,
      entity_type: 'publisher',
      entity_id: publisherId,
      action: 'approve'
    })
    if (logErr) {
      console.error('Failed to insert moderation log:', logErr)
    }

    try {
      const email = await getUserEmail(publisherId)
      await sendEmail({
        to: email,
        subject: getPubApprovedSub(),
        react: React.createElement(PublisherApproved, { fullName: publisher.full_name }),
        template: 'publisher_approved',
        recipientUserId: publisherId
      })
    } catch (e) {
      console.error('Failed to send publisher approval email:', e)
    }

    revalidatePath('/admin')
    return { ok: true }
  } catch {
    return { ok: false, formError: strings.admin.errorOccurred }
  }
}

export async function rejectPublisherAction(publisherId: string, reason: string): Promise<ActionResult> {
  reason = reason.trim()
  if (!isUuid(publisherId) || reason.length < 10 || reason.length > 2000) {
    return { ok: false, formError: strings.admin.dialog.rejectReasonMin }
  }

  try {
    const adminId = await checkAdmin()
    const supabase = await createClient()

    const { data: updated, error } = await supabase
      .from('profiles')
      .update({ publisher_status: 'blocked' })
      .eq('id', publisherId)
      .eq('publisher_status', 'pending')
      .select()

    if (error || !updated || updated.length === 0) {
      return { ok: false, formError: strings.admin.conflictError }
    }

    const { error: logErr } = await supabase.from('moderation_log').insert({
      actor_id: adminId,
      entity_type: 'publisher',
      entity_id: publisherId,
      action: 'reject',
      reason
    })
    if (logErr) {
      console.error('Failed to insert moderation log:', logErr)
    }

    revalidatePath('/admin')
    return { ok: true }
  } catch {
    return { ok: false, formError: strings.admin.errorOccurred }
  }
}
