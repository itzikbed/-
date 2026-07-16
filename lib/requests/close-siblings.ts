import { createAdminClient, createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/emails/send'
import { gendered } from '@/lib/strings'
import React from 'react'
import RequestClosedCatAdopted, { getSubject as getClosedSubject } from '@/emails/RequestClosedCatAdopted'
import { isUuid } from '@/lib/security/media'

export async function closeSiblings(catId: string) {
  if (!isUuid(catId)) return

  try {
    // Authorize the caller: this helper bypasses RLS via the service role, so it
    // must verify the caller is the cat's owner or an admin rather than trusting
    // that every call site checked first.
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const supabaseAdmin = createAdminClient()

    // 1. Get the cat's details (name, sex, owner) to authorize and format the note
    const { data: cat, error: catError } = await supabaseAdmin
      .from('cats')
      .select('name, sex, owner_id')
      .eq('id', catId)
      .single()

    if (catError || !cat) {
      console.error('[CLOSE SIBLINGS ERROR] Failed to fetch cat details:', catError?.message)
      return
    }

    if (cat.owner_id !== user.id) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (!profile || profile.role !== 'admin') return
    }

    // 2. Fetch all pending requests for this cat
    const { data: pendingRequests, error: reqError } = await supabaseAdmin
      .from('adoption_requests')
      .select('id, adopter_id')
      .eq('cat_id', catId)
      .eq('status', 'pending')

    if (reqError || !pendingRequests || pendingRequests.length === 0) {
      if (reqError) {
        console.error('[CLOSE SIBLINGS ERROR] Failed to fetch pending requests:', reqError.message)
      }
      return
    }

    const note = gendered('emails', 'catAdoptedSiblingNote', cat.sex).replace('{name}', cat.name)

    // 3. Update all pending requests to rejected
    const requestIds = pendingRequests.map(r => r.id)
    const { error: updateError } = await supabaseAdmin
      .from('adoption_requests')
      .update({
        status: 'rejected',
        admin_note: note,
        decided_at: new Date().toISOString()
      })
      .in('id', requestIds)

    if (updateError) {
      console.error(`[CLOSE SIBLINGS ERROR] Failed to reject sibling requests:`, updateError.message)
      return
    }

    // 4. Fire-and-log rejection emails to adopters
    for (const req of pendingRequests) {
      try {
        const { data, error: userError } = await supabaseAdmin.auth.admin.getUserById(req.adopter_id)
        if (userError || !data || !data.user || !data.user.email) {
          console.error('[CLOSE SIBLINGS EMAIL] Failed to resolve adopter email:', userError?.message)
          continue
        }

        await sendEmail({
          to: data.user.email,
          subject: getClosedSubject(cat.name, cat.sex as 'male' | 'female' | 'unknown'),
          react: React.createElement(RequestClosedCatAdopted, {
            catName: cat.name,
            catSex: cat.sex as 'male' | 'female' | 'unknown'
          }),
          template: 'request_closed_cat_adopted',
          recipientUserId: req.adopter_id,
          catId: catId,
          requestId: req.id
        })
      } catch (e) {
        console.error('[CLOSE SIBLINGS EMAIL] Failed to send auto-close email:', e instanceof Error ? e.message : String(e))
      }
    }
  } catch (err) {
    console.error('[CLOSE SIBLINGS EXCEPTION] Failed:', err instanceof Error ? err.message : String(err))
  }
}
