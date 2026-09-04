import React from 'react'
import SignupForm from '@/components/auth/SignupForm'
import { strings } from '@/lib/strings'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: `${strings.auth.signupTitle} — ${strings.common.siteName}`,
  description: strings.common.metaDesc,
  robots: 'noindex, nofollow',
}

export default function SignupPage() {
  return <SignupForm />
}
