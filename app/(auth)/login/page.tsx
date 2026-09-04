import React, { Suspense } from 'react'
import LoginForm from '@/components/auth/LoginForm'
import { strings } from '@/lib/strings'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: `${strings.auth.loginTitle} — ${strings.common.siteName}`,
  description: strings.common.metaDesc,
  robots: 'noindex, nofollow',
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex-grow flex items-center justify-center bg-paper text-ink">{strings.common.loading}</div>}>
      <LoginForm />
    </Suspense>
  )
}
