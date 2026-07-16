'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { checkAdmin } from './actions-helper'
import { ActionResult } from './actions'
import { strings } from '@/lib/strings'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Looks a registered auth user up by email via the service role. Callers must have
// verified the caller is an admin first (checkAdmin) — this reads auth.users.
async function findUserIdByEmail(email: string): Promise<string | null> {
  const supabaseService = createAdminClient()
  const target = email.trim().toLowerCase()
  const perPage = 200

  for (let page = 1; page <= 10; page++) {
    const { data, error } = await supabaseService.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const match = data.users.find((u) => (u.email || '').toLowerCase() === target)
    if (match) return match.id
    if (data.users.length < perPage) return null
  }
  return null
}

export async function promoteToAdminAction(email: string): Promise<ActionResult> {
  try {
    const adminId = await checkAdmin()

    if (typeof email !== 'string' || email.length > 254 || !EMAIL_RE.test(email.trim())) {
      return { ok: false, formError: strings.admin.promote.errInvalidEmail }
    }

    const targetId = await findUserIdByEmail(email)
    if (!targetId) return { ok: false, formError: strings.admin.promote.errNotFound }

    // All mutations run on the admin's own session client: RLS and the
    // guard_profile_privileges trigger authorize the role change (is_admin() = true).
    const supabase = await createClient()

    const { data: target } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', targetId)
      .single()

    if (!target) return { ok: false, formError: strings.admin.promote.errNotFound }
    if (target.role === 'admin') {
      return { ok: false, formError: strings.admin.promote.errAlreadyAdmin }
    }

    const { data: updated, error } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', targetId)
      .eq('role', target.role)
      .select('full_name')

    if (error || !updated || updated.length !== 1) {
      return { ok: false, formError: strings.admin.promote.errGeneric }
    }

    const { error: logErr } = await supabase.from('moderation_log').insert({
      actor_id: adminId,
      entity_type: 'profile',
      entity_id: targetId,
      action: 'promote_admin'
    })
    if (logErr) {
      console.error('Failed to insert moderation log for admin promotion:', logErr)
    }

    revalidatePath('/admin')
    return { ok: true, data: { fullName: updated[0].full_name } }
  } catch (err) {
    console.error('promoteToAdminAction failed:', err instanceof Error ? err.message : String(err))
    return { ok: false, formError: strings.admin.promote.errGeneric }
  }
}
