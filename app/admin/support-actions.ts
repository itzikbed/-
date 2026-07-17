'use server'

import { createClient } from '@/lib/supabase/server'
import { supportMessageSchema } from '@/lib/schemas/support'
import { checkAdmin } from './actions-helper'
import { ActionResult } from './actions'
import { strings } from '@/lib/strings'
import { isUuid } from '@/lib/security/media'
import type { SupportMessage } from '@/lib/support/chat'

export async function sendSupportReplyAction(
  conversationId: string,
  rawBody: string
): Promise<ActionResult<SupportMessage>> {
  if (!isUuid(conversationId)) return { ok: false, formError: strings.supportChat.sendError }

  const parsed = supportMessageSchema.safeParse({ body: rawBody })
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, formError: issue?.message || strings.supportChat.sendError }
  }

  try {
    const adminId = await checkAdmin()
    const supabase = await createClient()

    const { data: message, error } = await supabase
      .from('support_messages')
      .insert({ conversation_id: conversationId, sender_id: adminId, body: parsed.data.body })
      .select('*')
      .single()

    if (error || !message) {
      return { ok: false, formError: strings.supportChat.sendError }
    }
    return { ok: true, data: message }
  } catch {
    return { ok: false, formError: strings.admin.errorOccurred }
  }
}

export async function closeSupportConversationAction(conversationId: string): Promise<ActionResult> {
  if (!isUuid(conversationId)) return { ok: false, formError: strings.supportChat.adminCloseError }

  try {
    await checkAdmin()
    const supabase = await createClient()

    const { data: updated, error } = await supabase
      .from('support_conversations')
      .update({ status: 'closed' })
      .eq('id', conversationId)
      .eq('status', 'open')
      .select('id')
      .maybeSingle()

    if (error || !updated) {
      return { ok: false, formError: strings.supportChat.adminCloseError }
    }
    return { ok: true, data: { success: true } }
  } catch {
    return { ok: false, formError: strings.admin.errorOccurred }
  }
}
