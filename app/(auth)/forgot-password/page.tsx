import React from 'react'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'
import { strings } from '@/lib/strings'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: `${strings.auth.forgotPasswordTitle} — ${strings.common.siteName}`,
  description: strings.common.metaDesc,
  robots: 'noindex, nofollow'
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />
}
