import 'server-only'
import fs from 'fs'
import path from 'path'
import React from 'react'
import { after } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const resendApiKey = process.env.RESEND_API_KEY
const configuredFromAddress = process.env.RESEND_FROM_EMAIL
const isMock = !resendApiKey && process.env.NODE_ENV !== 'production'

// A message the provider accepted is not a message that arrived. 'accepted' is
// what we can actually observe; 'delivered' is reserved for a provider webhook.
// 'sent' is the pre-0018 vocabulary, kept so historical rows still count.
export const DISPATCHED_EMAIL_STATUSES = ['sent', 'accepted', 'delivered'] as const

export type EmailLogStatus = 'accepted' | 'failed'

export interface EmailReference {
  template: string
  recipientUserId?: string | null
  catId?: string | null
  requestId?: string | null
  conversationId?: string | null
}

export interface SendEmailOptions extends EmailReference {
  to: string | string[]
  subject: string
  react: React.ReactElement
  text?: string
}

// The single place that talks to the provider. The outbox worker and the direct
// senders share it, so mock mode, the From address and the error shape stay
// identical on every path.
export async function deliverEmail({ to, subject, html, text }: {
  to: string | string[]
  subject: string
  html: string
  text: string
}): Promise<{ id: string | null; error: string | null }> {
  if (!isMock && !resendApiKey) {
    console.error('[EMAIL CONFIG ERROR] Production email configuration is incomplete')
    return { id: null, error: 'Email service is not configured' }
  }

  if (isMock) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const outboxDir = path.join(process.cwd(), '.email-outbox')
    if (!fs.existsSync(outboxDir)) fs.mkdirSync(outboxDir, { recursive: true })
    const cleanSubject = subject.replace(/[^a-zA-Z0-9א-ת_-\s]/g, '').replace(/\s+/g, '_')
    const htmlFilepath = path.join(outboxDir, `${timestamp}-${cleanSubject}.html`)
    const txtFilepath = path.join(outboxDir, `${timestamp}-${cleanSubject}.txt`)
    fs.writeFileSync(htmlFilepath, html, 'utf8')
    fs.writeFileSync(txtFilepath, text, 'utf8')
    console.error(`[MOCK EMAIL SAVED] ${htmlFilepath} and ${txtFilepath}`)
    return { id: `mock-${Date.now()}`, error: null }
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(resendApiKey!)
    // RESEND_FROM_EMAIL overrides; the fallback matches the verified Resend
    // domain so a missing env var degrades gracefully instead of failing.
    const fromAddress = configuredFromAddress || 'בית לחתול <no-reply@homeforcats.org>'
    const res = await resend.emails.send({ from: fromAddress, to, subject, html, text })

    if (res.error) {
      console.error('[EMAIL ERROR] Provider rejected the message:', res.error.message)
      return { id: null, error: res.error.message }
    }
    console.error(`[EMAIL ACCEPTED] id: ${res.data?.id}`)
    return { id: res.data?.id ?? null, error: null }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err)
    console.error('[EMAIL EXCEPTION]', errMsg)
    return { id: null, error: errMsg }
  }
}

export async function recordEmailLog(
  reference: EmailReference,
  status: EmailLogStatus,
  errorText: string | null
) {
  try {
    const supabaseAdmin = createAdminClient()
    const { error } = await supabaseAdmin.from('email_log').insert({
      template: reference.template,
      recipient_user_id: reference.recipientUserId || null,
      cat_id: reference.catId || null,
      request_id: reference.requestId || null,
      conversation_id: reference.conversationId || null,
      status,
      error_text: errorText
    })
    if (error) console.error('[EMAIL LOG ERROR] Failed to write to email_log:', error.message)
  } catch (dbErr) {
    console.error('[EMAIL LOG EXCEPTION] Database write failed:', dbErr)
  }
}

export async function renderEmail(react: React.ReactElement, text?: string) {
  const { render } = await import('@react-email/components')
  const html = await render(react)
  const plainText = text || (await render(react, { plainText: true }))
  return { html, plainText }
}

// Direct send, used where the message is not tied to a business transaction
// (support chat, request decisions). Transitions that must not half-happen go
// through email_outbox instead — see lib/emails/outbox.ts.
export async function sendEmail({
  to,
  subject,
  react,
  text,
  template,
  recipientUserId = null,
  catId = null,
  requestId = null,
  conversationId = null
}: SendEmailOptions) {
  const reference: EmailReference = { template, recipientUserId, catId, requestId, conversationId }

  const run = async () => {
    const { html, plainText } = await renderEmail(react, text)
    const { id, error } = await deliverEmail({ to, subject, html, text: plainText })
    await recordEmailLog(reference, error ? 'failed' : 'accepted', error)
    return { data: id ? { id } : null, error: error ? new Error(error) : null }
  }

  // Use Next's after() for background processing if inside a request context
  try {
    after(run)
    return { data: { id: 'scheduled' }, error: null }
  } catch {
    // Fallback to synchronous run if called outside a request context (e.g. testing/scripts)
    return run()
  }
}
