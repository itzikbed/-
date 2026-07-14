'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import React from 'react'
import { sendEmail } from '@/lib/emails/send'
import CatApproved, { getSubject as getCatApprovedSub } from '@/emails/CatApproved'
import CatRejected, { getSubject as getCatRejectedSub } from '@/emails/CatRejected'
import { checkAdmin, getUserEmail } from './actions-helper'
import { ActionResult } from './actions'
import { strings } from '@/lib/strings'

export async function approveCatAction(catId: string): Promise<ActionResult> {
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

    await supabase.from('moderation_log').insert({
      actor_id: adminId,
      entity_type: 'cat',
      entity_id: catId,
      action: 'approve'
    })

    void (async () => {
      try {
        const email = await getUserEmail(cat.owner_id)
        await sendEmail({
          to: email,
          subject: getCatApprovedSub(cat.name, cat.sex as 'male' | 'female' | 'unknown'),
          react: React.createElement(CatApproved, { catName: cat.name, catSex: cat.sex as 'male' | 'female' | 'unknown', catId: cat.id })
        })
      } catch (e) {
        console.error('Failed to send cat approval email:', e)
      }
    })()

    revalidatePath('/cats')
    revalidatePath('/admin')
    revalidatePath('/')
    return { ok: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, formError: message || strings.admin.errorOccurred }
  }
}

export async function rejectCatAction(catId: string, reason: string): Promise<ActionResult> {
  if (!reason || reason.trim().length < 10) {
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

    await supabase.from('moderation_log').insert({
      actor_id: adminId,
      entity_type: 'cat',
      entity_id: catId,
      action: 'reject',
      reason
    })

    void (async () => {
      try {
        const email = await getUserEmail(cat.owner_id)
        await sendEmail({
          to: email,
          subject: getCatRejectedSub(cat.name, cat.sex as 'male' | 'female' | 'unknown'),
          react: React.createElement(CatRejected, { catName: cat.name, catSex: cat.sex as 'male' | 'female' | 'unknown', catId: cat.id, reason })
        })
      } catch (e) {
        console.error('Failed to send cat rejection email:', e)
      }
    })()

    revalidatePath('/admin')
    return { ok: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, formError: message || strings.admin.errorOccurred }
  }
}
