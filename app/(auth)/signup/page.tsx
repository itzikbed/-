'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Mascot } from '@/components/mascot/mascot'
import { signupAction } from '../actions'
import { strings } from '@/lib/strings'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{
    form?: string
    fullName?: string
    phone?: string
    email?: string
    password?: string
  }>({})
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    // Basic client validation
    const clientErrors: typeof errors = {}
    if (!fullName) clientErrors.fullName = strings.common.requiredField
    if (!phone) clientErrors.phone = strings.common.requiredField
    if (!email) clientErrors.email = strings.common.requiredField
    if (!password) clientErrors.password = strings.common.requiredField

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      setLoading(false)
      return
    }

    try {
      const res = await signupAction({
        email,
        password,
        fullName,
        phone
      })

      if (!res.ok) {
        if (res.formError) {
          setErrors({ form: res.formError })
        } else if (res.fieldErrors) {
          setErrors({
            email: res.fieldErrors.email?.[0],
            password: res.fieldErrors.password?.[0],
            fullName: res.fieldErrors.fullName?.[0],
            phone: res.fieldErrors.phone?.[0]
          })
        }
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push('/login')
        }, 2000)
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
        {/* Mascot Celebrating or Peeking */}
        <div className="absolute bottom-full inset-inline-start-1/2 -translate-x-1/2 translate-y-2 pointer-events-none transition-transform duration-200 ease-out group-hover:-translate-y-4">
          <Mascot pose={success ? 'celebrating' : 'peek'} />
        </div>

        {/* Card */}
        <div className="bg-surface rounded-card border border-border shadow-resting p-8 relative z-10">
          <h2 className="text-2xl font-display font-extrabold text-ink mb-6 text-center">
            {strings.auth.signupTitle}
          </h2>

          {success && (
            <div className="mb-4 p-4 bg-pine-soft text-pine rounded-input text-sm font-semibold text-center">
              {strings.auth.signupSuccessMsg}
            </div>
          )}

          {errors.form && (
            <div role="alert" className="mb-4 p-3 bg-danger/10 text-danger rounded-input text-sm font-semibold">
              {errors.form}
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                type="text"
                label={strings.auth.fullNameLabel}
                placeholder={strings.auth.fullNamePlaceholder}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                error={errors.fullName}
                disabled={loading}
                required
              />

              <Input
                type="tel"
                label={strings.auth.phoneLabel}
                placeholder={strings.auth.phonePlaceholder}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                error={errors.phone}
                disabled={loading}
                required
              />

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
                {strings.auth.signupSubmitBtn}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center text-sm">
            <span className="text-ink-soft">{strings.auth.hasAccountPrompt} </span>
            <Link href="/login" className="text-pine font-semibold hover:underline">
              {strings.nav.login}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
