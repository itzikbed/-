import 'server-only'
import fs from 'fs'
import path from 'path'
import React from 'react'
import { after } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const resendApiKey = process.env.RESEND_API_KEY
const configuredFromAddress = process.env.RESEND_FROM_EMAIL
const isMock = !resendApiKey && process.env.NODE_ENV !== 'production'

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  react: React.ReactElement
  text?: string
  template: string
  recipientUserId?: string | null
  catId?: string | null
  requestId?: string | null
  conversationId?: string | null
}

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
  const run = async () => {
    try {
      if (!isMock && (!resendApiKey || !configuredFromAddress)) {
        console.error('[EMAIL CONFIG ERROR] Production email configuration is incomplete')
        await logToDb('failed', 'Email service is not configured')
        return { data: null, error: new Error('Email service is not configured') }
      }

      const { Resend } = await import('resend')
      const { render } = await import('@react-email/components')

      const html = await render(react)
      const plainText = text || (await render(react, { plainText: true }))

      if (isMock) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const outboxDir = path.join(process.cwd(), '.email-outbox')
        if (!fs.existsSync(outboxDir)) {
          fs.mkdirSync(outboxDir, { recursive: true })
        }
        const cleanSubject = subject.replace(/[^a-zA-Z0-9א-ת_-\s]/g, '').replace(/\s+/g, '_')
        const htmlFilename = `${timestamp}-${cleanSubject}.html`
        const txtFilename = `${timestamp}-${cleanSubject}.txt`
        const htmlFilepath = path.join(outboxDir, htmlFilename)
        const txtFilepath = path.join(outboxDir, txtFilename)
        fs.writeFileSync(htmlFilepath, html, 'utf8')
        fs.writeFileSync(txtFilepath, plainText, 'utf8')
        console.error(`[MOCK EMAIL SAVED] ${htmlFilepath} and ${txtFilepath}`)
        
        await logToDb('sent', null)
        return { data: { id: `mock-${Date.now()}` }, error: null }
      }

      const resend = new Resend(resendApiKey!)
      const fromAddress = 'בית לחתול <no-reply@domain>'
      
      const res = await resend.emails.send({
        from: configuredFromAddress || fromAddress,
        to,
        subject,
        html,
        text: plainText,
      })

      if (res.error) {
        console.error('[EMAIL ERROR] Provider rejected the message:', res.error.message)
        await logToDb('failed', res.error.message)
      } else {
        console.error(`[EMAIL SENT] id: ${res.data?.id}`)
        await logToDb('sent', null)
      }
      return res
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      console.error('[EMAIL EXCEPTION]', errMsg)
      await logToDb('failed', errMsg)
      return { data: null, error: err }
    }
  }

  async function logToDb(status: 'sent' | 'failed', errorText: string | null) {
    try {
      const supabaseAdmin = createAdminClient()
      const { error } = await supabaseAdmin.from('email_log').insert({
        template,
        recipient_user_id: recipientUserId || null,
        cat_id: catId || null,
        request_id: requestId || null,
        conversation_id: conversationId || null,
        status,
        error_text: errorText
      })
      if (error) {
        console.error('[EMAIL LOG ERROR] Failed to write to email_log:', error.message)
      }
    } catch (dbErr) {
      console.error('[EMAIL LOG EXCEPTION] Database write failed:', dbErr)
    }
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
