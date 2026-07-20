'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Mascot } from '@/components/mascot/Mascot'
import { signupAction } from '@/app/(auth)/actions'
import { signupSchema, SignupInput } from '@/lib/schemas/auth'
import { strings } from '@/lib/strings'
import { TurnstileWidget } from './TurnstileWidget'
import {
  getCaptchaTokenForSubmission,
  getConfiguredTurnstileSiteKey,
} from './turnstile-config'

export default function SignupForm() {
  const [success, setSuccess] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [loading, setLoading] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string>()
  const [captchaResetKey, setCaptchaResetKey] = useState(0)
  const router = useRouter()
  const searchParams = useSearchParams()
  const turnstileSiteKey = getConfiguredTurnstileSiteKey()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { consent: false }
  })

  const onSubmit = async (data: SignupInput) => {
    setLoading(true)
    try {
      const verifiedCaptchaToken = getCaptchaTokenForSubmission(turnstileSiteKey, captchaToken)
      const res = await signupAction({
        ...data,
        ...(verifiedCaptchaToken ? { captchaToken: verifiedCaptchaToken } : {}),
      })
      if (!res.ok) {
        setCaptchaToken(undefined)
        setCaptchaResetKey((key) => key + 1)
        if (res.formError) {
          setError('root.serverError', { message: res.formError })
        } else if (res.fieldErrors) {
          Object.entries(res.fieldErrors).forEach(([field, messages]) => {
            setError(field as keyof SignupInput, { message: messages?.[0] })
          })
        }
      } else {
        const confirmationPending =
          (res.data as { needsConfirmation?: boolean } | undefined)?.needsConfirmation === true
        setSuccess(true)
        if (confirmationPending) {
          // The account only activates via the email link — keep the notice on
          // screen instead of bouncing to a login that would reject them.
          setNeedsConfirmation(true)
        } else {
          setTimeout(() => {
            router.push(`/login${searchParams.toString() ? '?' + searchParams.toString() : ''}`)
          }, 2000)
        }
      }
    } catch {
      setCaptchaToken(undefined)
      setCaptchaResetKey((key) => key + 1)
      setError('root.serverError', { message: strings.common.errorOccurred })
    } finally {
      setLoading(false)
    }
  }

  const serverError = errors.root?.serverError?.message

  return (
    <div className="flex-grow flex flex-col items-center justify-center px-4 py-16 bg-paper">
      <div className="w-full max-w-md relative mt-12 group">
        {/* Mascot Celebrating or Peeking */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 translate-y-2 pointer-events-none transition-transform duration-200 ease-out group-hover:-translate-y-4">
          <Mascot pose={success ? 'celebrating' : 'peek'} />
        </div>

        {/* Card */}
        <div className="bg-surface rounded-card border border-border shadow-resting p-8 relative z-10">
          <h2 className="text-2xl font-display font-extrabold text-ink mb-6 text-center select-none">
            {strings.auth.signupTitle}
          </h2>

          {success && (
            <div
              role="status"
              className="mb-4 p-4 bg-pine-soft text-pine rounded-input text-sm font-semibold text-center"
            >
              {needsConfirmation ? strings.auth.signupConfirmMsg : strings.auth.signupSuccessMsg}
            </div>
          )}

          {serverError && (
            <div role="alert" className="mb-4 p-3 bg-danger/10 text-danger rounded-input text-sm font-semibold">
              {serverError}
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <Input
                type="text"
                label={strings.auth.fullNameLabel}
                placeholder={strings.auth.fullNamePlaceholder}
                error={errors.fullName?.message}
                disabled={loading}
                {...register('fullName')}
              />

              <Input
                type="tel"
                label={strings.auth.phoneLabel}
                placeholder={strings.auth.phonePlaceholder}
                error={errors.phone?.message}
                disabled={loading}
                {...register('phone')}
              />

              <Input
                type="email"
                label={strings.auth.emailLabel}
                placeholder={strings.auth.emailPlaceholder}
                error={errors.email?.message}
                disabled={loading}
                {...register('email')}
              />

              <Input
                type="password"
                label={strings.auth.passwordLabel}
                placeholder={strings.auth.passwordPlaceholder}
                autoComplete="new-password"
                error={errors.password?.message}
                disabled={loading}
                {...register('password')}
              />

              <Checkbox
                label={
                  <span className="text-sm">
                    {strings.auth.signupConsentPrefix}
                    <Link href="/terms" target="_blank" className="text-pine font-semibold hover:underline">
                      {strings.auth.consentTerms}
                    </Link>
                    {strings.auth.consentAnd}
                    <Link href="/privacy" target="_blank" className="text-pine font-semibold hover:underline">
                      {strings.auth.consentPrivacy}
                    </Link>
                  </span>
                }
                error={errors.consent?.message}
                disabled={loading}
                {...register('consent')}
              />

              <p className="text-xs text-ink-soft leading-relaxed">
                {strings.auth.privacyNotice}
              </p>

              {turnstileSiteKey && (
                <TurnstileWidget
                  key={captchaResetKey}
                  siteKey={turnstileSiteKey}
                  action="signup"
                  label={strings.auth.captchaLabel}
                  errorMessage={strings.auth.captchaError}
                  onTokenChange={setCaptchaToken}
                />
              )}

              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={Boolean(turnstileSiteKey) && !captchaToken}
                className="w-full mt-2"
              >
                {strings.auth.signupSubmitBtn}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center text-sm select-none">
            <span className="text-ink-soft">{strings.auth.hasAccountPrompt} </span>
            <Link 
              href={`/login${searchParams.toString() ? '?' + searchParams.toString() : ''}`} 
              className="text-pine font-semibold hover:underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2"
            >
              {strings.nav.login}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
