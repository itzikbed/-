'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import React from 'react'
import { sendEmail } from '@/lib/emails/send'
import RequestApproved, { getSubject as getReqApprovedSub } from '@/emails/RequestApproved'
import RequestRejected, { getSubject as getReqRejectedSub } from '@/emails/RequestRejected'
import { checkAdmin, getUserEmail } from './actions-helper'
import { ActionResult } from './actions'
import { strings } from '@/lib/strings'
import { isUuid } from '@/lib/security/media'

export async function approveAdoptionRequestAction(requestId: string): Promise<ActionResult> {
  if (!isUuid(requestId)) return { ok: false, formError: strings.admin.conflictError }

  try {
    const adminId = await checkAdmin()
    const supabase = await createClient()

    const { data: updated, error } = await supabase
      .from('adoption_requests')
      .update({ status: 'approved', decided_by: adminId, decided_at: new Date().toISOString() })
      .eq('id', requestId)
      .eq('status', 'pending')
      .select('*, cats(name, sex, owner_id)')
      .single()

    if (error || !updated) {
      return { ok: false, formError: strings.admin.conflictError }
    }

    const req = updated
    const cat = req.cats as unknown as { name: string; sex: string; owner_id: string }

    const { error: logErr } = await supabase.from('moderation_log').insert({
      actor_id: adminId,
      entity_type: 'request',
      entity_id: requestId,
      action: 'approve'
    })
    if (logErr) {
      console.error('Failed to insert moderation log:', logErr)
    }

    const { data: adopter } = await supabase.from('profiles').select('full_name, phone').eq('id', req.adopter_id).single()
    const { data: owner } = await supabase.from('profiles').select('full_name, phone').eq('id', cat.owner_id).single()

    if (adopter && owner) {
      try {
        const adopterEmail = await getUserEmail(req.adopter_id)
        await sendEmail({
          to: adopterEmail,
          subject: getReqApprovedSub(cat.name, cat.sex as 'male' | 'female' | 'unknown', 'adopter'),
          react: React.createElement(RequestApproved, {
            catName: cat.name,
            catSex: cat.sex as 'male' | 'female' | 'unknown',
            recipientRole: 'adopter',
            counterpartName: owner.full_name,
            counterpartPhone: owner.phone || ''
          }),
          template: 'request_approved_adopter',
          recipientUserId: req.adopter_id,
          catId: req.cat_id,
          requestId: req.id
        })
      } catch (e) {
        console.error('Failed to send adopter request approval email:', e)
      }

      try {
        const ownerEmail = await getUserEmail(cat.owner_id)
        await sendEmail({
          to: ownerEmail,
          subject: getReqApprovedSub(cat.name, cat.sex as 'male' | 'female' | 'unknown', 'publisher'),
          react: React.createElement(RequestApproved, {
            catName: cat.name,
            catSex: cat.sex as 'male' | 'female' | 'unknown',
            recipientRole: 'publisher',
            counterpartName: adopter.full_name,
            counterpartPhone: adopter.phone || ''
          }),
          template: 'request_approved_publisher',
          recipientUserId: cat.owner_id,
          catId: req.cat_id,
          requestId: req.id
        })
      } catch (e) {
        console.error('Failed to send owner request approval email:', e)
      }
    } else {
      console.error('[REQUEST APPROVAL ERROR] Failed to resolve profiles for adopter or owner. Emails skipped.')
    }

    revalidatePath('/requests')
    revalidatePath('/admin')
    return { ok: true }
  } catch {
    return { ok: false, formError: strings.admin.errorOccurred }
  }
}

export async function rejectAdoptionRequestAction(requestId: string, reason: string): Promise<ActionResult> {
  reason = reason.trim()
  if (!isUuid(requestId) || reason.length < 10 || reason.length > 2000) {
    return { ok: false, formError: strings.admin.dialog.rejectReasonMin }
  }

  try {
    const adminId = await checkAdmin()
    const supabase = await createClient()

    const { data: updated, error } = await supabase
      .from('adoption_requests')
      .update({
        status: 'rejected',
        admin_note: reason,
        decided_by: adminId,
        decided_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .eq('status', 'pending')
      .select('*, cats(name, sex)')
      .single()

    if (error || !updated) {
      return { ok: false, formError: strings.admin.conflictError }
    }

    const req = updated
    const cat = req.cats as unknown as { name: string; sex: string }

    const { error: logErr } = await supabase.from('moderation_log').insert({
      actor_id: adminId,
      entity_type: 'request',
      entity_id: requestId,
      action: 'reject',
      reason
    })
    if (logErr) {
      console.error('Failed to insert moderation log:', logErr)
    }

    try {
      const adopterEmail = await getUserEmail(req.adopter_id)
      await sendEmail({
        to: adopterEmail,
        subject: getReqRejectedSub(cat.name, cat.sex as 'male' | 'female' | 'unknown'),
        react: React.createElement(RequestRejected, { catName: cat.name, catSex: cat.sex as 'male' | 'female' | 'unknown', adminNote: reason }),
        template: 'request_rejected',
        recipientUserId: req.adopter_id,
        catId: req.cat_id,
        requestId: req.id
      })
    } catch (e) {
      console.error('Failed to send request rejection email:', e)
    }

    revalidatePath('/requests')
    revalidatePath('/admin')
    return { ok: true }
  } catch {
    return { ok: false, formError: strings.admin.errorOccurred }
  }
}
