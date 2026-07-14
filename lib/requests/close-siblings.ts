import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/emails/send'
import { gendered } from '@/lib/strings'
import React from 'react'
import RequestClosedCatAdopted, { getSubject as getClosedSubject } from '@/emails/RequestClosedCatAdopted'

export async function closeSiblings(catId: string) {
  try {
    const supabaseAdmin = createAdminClient()

    // 1. Get the cat's details (name and sex) to format the rejection note
    const { data: cat, error: catError } = await supabaseAdmin
      .from('cats')
      .select('name, sex')
      .eq('id', catId)
      .single()

    if (catError || !cat) {
      console.error(`[CLOSE SIBLINGS ERROR] Failed to fetch cat ${catId} details:`, catError?.message)
      return
    }

    // 2. Fetch all pending requests for this cat
    const { data: pendingRequests, error: reqError } = await supabaseAdmin
      .from('adoption_requests')
      .select('id, adopter_id')
      .eq('cat_id', catId)
      .eq('status', 'pending')

    if (reqError || !pendingRequests || pendingRequests.length === 0) {
      if (reqError) {
        console.error(`[CLOSE SIBLINGS ERROR] Failed to fetch pending requests for cat ${catId}:`, reqError.message)
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
      void (async () => {
        try {
          const { data, error: userError } = await supabaseAdmin.auth.admin.getUserById(req.adopter_id)
          if (userError || !data || !data.user || !data.user.email) {
            console.error(`[CLOSE SIBLINGS EMAIL] Failed to resolve email for adopter ${req.adopter_id}:`, userError?.message)
            return
          }

          await sendEmail({
            to: data.user.email,
            subject: getClosedSubject(cat.name, cat.sex as 'male' | 'female' | 'unknown'),
            react: React.createElement(RequestClosedCatAdopted, {
              catName: cat.name,
              catSex: cat.sex as 'male' | 'female' | 'unknown'
            })
          })
        } catch (e) {
          console.error(`[CLOSE SIBLINGS EMAIL] Failed to send auto-close email to adopter ${req.adopter_id}:`, e)
        }
      })()
    }
  } catch (err) {
    console.error('[CLOSE SIBLINGS EXCEPTION] Failed:', err)
  }
}
