'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Mascot } from '@/components/mascot/Mascot'
import { forgotPasswordAction } from '@/app/(auth)/actions'
import { strings } from '@/lib/strings'

export const ForgotPasswordForm: React.FC = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      setError(strings.auth.invalidEmailInput)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await forgotPasswordAction(email)
      if (res.ok) {
        setSuccess(true)
      } else {
        setError(res.formError || strings.auth.forgotPasswordError)
      }
    } catch {
      setError(strings.common.errorOccurred)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-grow flex flex-col items-center justify-center px-4 py-16 bg-paper select-none">
      <div className="w-full max-w-md relative mt-12 group">
        
        {/* Mascot Peeking */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 translate-y-2 pointer-events-none transition-transform duration-200 ease-out group-hover:-translate-y-4">
          <Mascot pose="peek" />
        </div>

        {/* Card */}
        <div className="bg-surface rounded-card border border-border shadow-resting p-8 relative z-10 text-start">
          <h2 className="text-2xl font-display font-extrabold text-ink mb-6 text-center">
            {strings.auth.forgotPasswordTitle}
          </h2>

          {success ? (
            <div className="space-y-6 text-center">
              <div className="bg-pine-soft text-pine p-4 rounded-input text-sm font-semibold border border-pine/10">
                {strings.auth.forgotPasswordSuccess}
              </div>
              <Link 
                href="/login"
                className="inline-block text-pine font-bold hover:underline"
              >
                {strings.auth.backToLogin}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <p className="text-sm text-ink-soft leading-relaxed font-semibold mb-2">
                {strings.auth.forgotPasswordIntro}
              </p>

              {error && (
                <div role="alert" className="p-3 bg-danger/10 text-danger rounded-input text-sm font-semibold">
                  {error}
                </div>
              )}

              <Input
                type="email"
                label={strings.auth.emailLabel}
                placeholder={strings.auth.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />

              <Button type="submit" variant="primary" loading={loading} className="w-full mt-2">
                {strings.auth.sendResetLink}
              </Button>

              <div className="text-center mt-4">
                <Link 
                  href="/login"
                  className="text-sm text-pine font-semibold hover:underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine"
                >
                  {strings.auth.backToLogin}
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
