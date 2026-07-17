'use server'

import React from 'react'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { supportMessageSchema } from '@/lib/schemas/support'
import { sendEmail } from '@/lib/emails/send'
import SupportChatNew, { getSubject as getSupportChatSubject } from '@/emails/SupportChatNew'
import { strings } from '@/lib/strings'
import type { SupportMessage } from '@/lib/support/chat'

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; formError?: string; fieldErrors?: Record<string, string[]> }

export interface SentSupportMessage {
  conversationId: string
  message: SupportMessage
}

export async function sendSupportMessageAction(rawBody: string): Promise<ActionResult<SentSupportMessage>> {
  const parsed = supportMessageSchema.safeParse({ body: rawBody })
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, formError: issue?.message || strings.supportChat.sendError }
  }
  const body = parsed.data.body

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, formError: strings.supportChat.mustLoginError }
  }

  // Locate the user's single conversation: reuse the open one, reopen the most
  // recent closed one, or start a fresh one (documented in migration 0016).
  let conversationId: string | null = null

  const { data: openConv } = await supabase
    .from('support_conversations')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'open')
    .maybeSingle()

  if (openConv) {
    conversationId = openConv.id
  } else {
    const { data: lastConv } = await supabase
      .from('support_conversations')
      .select('id, status')
      .eq('user_id', user.id)
      .order('last_message_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (lastConv) {
      const { error: reopenErr } = await supabase
        .from('support_conversations')
        .update({ status: 'open' })
        .eq('id', lastConv.id)
        .eq('status', 'closed')
      if (reopenErr) {
        return { ok: false, formError: strings.supportChat.sendError }
      }
      conversationId = lastConv.id
    } else {
      const { data: created, error: createErr } = await supabase
        .from('support_conversations')
        .insert({ user_id: user.id })
        .select('id')
        .single()
      if (createErr || !created) {
        // 23505 = another tab created the open conversation concurrently
        if (createErr?.code === '23505') {
          const { data: raced } = await supabase
            .from('support_conversations')
            .select('id')
            .eq('user_id', user.id)
            .eq('status', 'open')
            .maybeSingle()
          conversationId = raced?.id || null
        }
        if (!conversationId) {
          return { ok: false, formError: strings.supportChat.sendError }
        }
      } else {
        conversationId = created.id
      }
    }
  }

  const { data: message, error: insertErr } = await supabase
    .from('support_messages')
    .insert({ conversation_id: conversationId, sender_id: user.id, body })
    .select('*')
    .single()

  if (insertErr || !message) {
    if (insertErr?.message?.includes('rate limit')) {
      return { ok: false, formError: strings.supportChat.rateLimitError }
    }
    if (insertErr?.code === '23514') {
      return { ok: false, formError: strings.supportChat.tooLongError }
    }
    return { ok: false, formError: strings.supportChat.sendError }
  }

  try {
    await notifyAdminsIfFirstUnread(user.id, conversationId, message.id)
  } catch (e) {
    console.error('[SUPPORT CHAT EMAIL] notify failed:', e instanceof Error ? e.message : String(e))
  }

  return { ok: true, data: { conversationId, message } }
}

// Email the admins only when this is the first message the team has not read in
// this conversation, and no such email already went out in the last hour
// (throttled through email_log, following the 0012 pattern).
async function notifyAdminsIfFirstUnread(userId: string, conversationId: string, newMessageId: string) {
  const admin = createAdminClient()

  const { count: unreadBefore } = await admin
    .from('support_messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)
    .is('read_by_admin_at', null)
    .neq('id', newMessageId)
  if (unreadBefore && unreadBefore > 0) return

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count: recentEmails } = await admin
    .from('email_log')
    .select('id', { count: 'exact', head: true })
    .eq('template', 'support_chat_new')
    .eq('conversation_id', conversationId)
    .eq('status', 'sent')
    .gt('created_at', oneHourAgo)
  if (recentEmails && recentEmails > 0) return

  const { data: adminProfiles } = await admin.from('profiles').select('id').eq('role', 'admin')
  if (!adminProfiles || adminProfiles.length === 0) return

  const adminEmails: string[] = []
  for (const profile of adminProfiles) {
    const { data } = await admin.auth.admin.getUserById(profile.id)
    if (data.user?.email) adminEmails.push(data.user.email)
  }
  if (adminEmails.length === 0) return

  const { data: senderProfile } = await admin
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .single()
  const senderName = senderProfile?.full_name || strings.supportChat.userFallbackName

  await sendEmail({
    to: adminEmails,
    subject: getSupportChatSubject(senderName),
    react: React.createElement(SupportChatNew, { userName: senderName }),
    template: 'support_chat_new',
    conversationId
  })
}
