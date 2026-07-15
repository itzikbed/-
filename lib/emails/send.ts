import 'server-only'
import fs from 'fs'
import path from 'path'
import React from 'react'

const resendApiKey = process.env.RESEND_API_KEY
const configuredFromAddress = process.env.RESEND_FROM_EMAIL
const isMock = !resendApiKey && process.env.NODE_ENV !== 'production'

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  react: React.ReactElement
  text?: string
}

export async function sendEmail({ to, subject, react, text }: SendEmailOptions) {
  try {
    if (!isMock && (!resendApiKey || !configuredFromAddress)) {
      console.error('[EMAIL CONFIG ERROR] Production email configuration is incomplete')
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
      // Log only the provider message, never the full error object (may echo the recipient address).
      console.error('[EMAIL ERROR] Provider rejected the message:', res.error.message)
    } else {
      console.error(`[EMAIL SENT] id: ${res.data?.id}`)
    }
    return res
  } catch (err: unknown) {
    console.error('[EMAIL EXCEPTION]', err instanceof Error ? err.message : String(err))
    return { data: null, error: err }
  }
}
