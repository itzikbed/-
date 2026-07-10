'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Mascot } from '@/components/mascot/mascot'
import { loginAction } from '../actions'
import { strings } from '@/lib/strings'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ form?: string; email?: string; password?: string }>({})
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    // Client-side simple validation first
    const clientErrors: typeof errors = {}
    if (!email) clientErrors.email = strings.common.requiredField
    if (!password) clientErrors.password = strings.common.requiredField
    
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      setLoading(false)
      return
    }

    try {
      const res = await loginAction({ email, password })
      if (!res.ok) {
        if (res.formError) {
          setErrors({ form: res.formError })
        } else if (res.fieldErrors) {
          setErrors({
            email: res.fieldErrors.email?.[0],
            password: res.fieldErrors.password?.[0]
          })
        }
      } else {
        router.push('/')
        router.refresh()
      }
    } catch {
      setErrors({ form: strings.common.errorOccurred })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-grow flex flex-col items-center justify-center px-4 py-16 bg-paper">
      <div className="w-full max-w-md relative mt-12 group">
        {/* Mascot Peeking over the Card on Hover */}
        <div className="absolute bottom-full inset-inline-start-1/2 -translate-x-1/2 translate-y-2 pointer-events-none transition-transform duration-200 ease-out group-hover:-translate-y-4">
          <Mascot pose="peek" />
        </div>

        {/* Card */}
        <div className="bg-surface rounded-card border border-border shadow-resting p-8 relative z-10">
          <h2 className="text-2xl font-display font-extrabold text-ink mb-6 text-center">
            {strings.auth.loginTitle}
          </h2>

          {errors.form && (
            <div role="alert" className="mb-4 p-3 bg-danger/10 text-danger rounded-input text-sm font-semibold">
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              type="email"
              label={strings.auth.emailLabel}
              placeholder={strings.auth.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              disabled={loading}
              required
            />

            <Input
              type="password"
              label={strings.auth.passwordLabel}
              placeholder={strings.auth.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              disabled={loading}
              required
            />

            <Button type="submit" variant="primary" loading={loading} className="w-full mt-2">
              {strings.auth.loginSubmitBtn}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-ink-soft">{strings.auth.noAccountPrompt} </span>
            <Link href="/signup" className="text-pine font-semibold hover:underline">
              {strings.nav.signup}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
