import React from 'react'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'
import { strings } from '@/lib/strings'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: `${strings.auth.resetPasswordTitle} — ${strings.common.siteName}`,
  description: strings.common.metaDesc,
  robots: 'noindex, nofollow'
}

export default function ResetPasswordPage() {
  return <ResetPasswordForm />
}
