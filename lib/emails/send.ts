import fs from 'fs'
import path from 'path'
import React from 'react'

const resendApiKey = process.env.RESEND_API_KEY || 're_local_mock_key'
const isMock = resendApiKey === 're_local_mock_key'

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  react: React.ReactElement
  text?: string
}

export async function sendEmail({ to, subject, react, text }: SendEmailOptions) {
  try {
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
      console.error(`[MOCK EMAIL SENT] to: ${JSON.stringify(to)} | subject: ${subject} | saved to: ${htmlFilepath} and ${txtFilepath}`)
      return { data: { id: `mock-${Date.now()}` }, error: null }
    }

    const resend = new Resend(resendApiKey)
    const fromAddress = 'בית לחתול <no-reply@domain>'
    
    const res = await resend.emails.send({
      from: fromAddress,
      to,
      subject,
      html,
      text: plainText,
    })

    if (res.error) {
      console.error(`[EMAIL ERROR] Failed to send email to ${JSON.stringify(to)}:`, res.error)
    } else {
      console.error(`[EMAIL SENT] to: ${JSON.stringify(to)} | subject: ${subject} | id: ${res.data?.id}`)
    }
    return res
  } catch (err: unknown) {
    console.error(`[EMAIL EXCEPTION] Failed to send email to ${JSON.stringify(to)}:`, err instanceof Error ? err.message : String(err))
    return { data: null, error: err }
  }
}
