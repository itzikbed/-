'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Mascot } from '@/components/mascot/Mascot'
import { loginAction } from '@/app/(auth)/actions'
import { loginSchema, LoginInput } from '@/lib/schemas/auth'
import { strings } from '@/lib/strings'

import { getSafeRedirect } from '@/lib/utils/safe-redirect'

export default function LoginForm() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = getSafeRedirect(searchParams.get('redirect'))
  const callbackFailed = searchParams.get('error') === 'auth_callback_failed'

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginInput) => {
    setLoading(true)
    try {
      const res = await loginAction(data)
      if (!res.ok) {
        if (res.formError) {
          setError('root.serverError', { message: res.formError })
        } else if (res.fieldErrors) {
          Object.entries(res.fieldErrors).forEach(([field, messages]) => {
            setError(field as keyof LoginInput, { message: messages?.[0] })
          })
        }
      } else {
        router.push(redirectUrl)
        router.refresh()
      }
    } catch {
      setError('root.serverError', { message: strings.common.errorOccurred })
    } finally {
      setLoading(false)
    }
  }

  const serverError = errors.root?.serverError?.message

  return (
    <div className="flex-grow flex flex-col items-center justify-center px-4 py-16 bg-paper">
      <div className="w-full max-w-md relative mt-12 group">
        {/* Mascot Peeking over the Card on Hover */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 translate-y-2 pointer-events-none transition-transform duration-200 ease-out group-hover:-translate-y-4">
          <Mascot pose="peek" />
        </div>

        {/* Card */}
        <div className="bg-surface rounded-card border border-border shadow-resting p-8 relative z-10">
          <h2 className="text-2xl font-display font-extrabold text-ink mb-6 text-center select-none">
            {strings.auth.loginTitle}
          </h2>

          {callbackFailed && !serverError && (
            <div role="alert" className="mb-4 p-3 bg-danger/10 text-danger rounded-input text-sm font-semibold">
              {strings.auth.authCallbackFailed}
            </div>
          )}

          {serverError && (
            <div role="alert" className="mb-4 p-3 bg-danger/10 text-danger rounded-input text-sm font-semibold">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
              autoComplete="current-password"
              error={errors.password?.message}
              disabled={loading}
              {...register('password')}
            />

            <div className="flex justify-end -mt-2">
              <Link 
                href={`/forgot-password${searchParams.toString() ? '?' + searchParams.toString() : ''}`} 
                className="text-xs text-pine font-semibold hover:underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine"
              >
                {strings.auth.forgotPasswordLink}
              </Link>
            </div>
 
            <Button type="submit" variant="primary" loading={loading} className="w-full mt-2">
              {strings.auth.loginSubmitBtn}
            </Button>
          </form>
 
          <div className="mt-6 text-center text-sm select-none">
            <span className="text-ink-soft">{strings.auth.noAccountPrompt} </span>
            <Link 
              href={`/signup${searchParams.toString() ? '?' + searchParams.toString() : ''}`} 
              className="text-pine font-semibold hover:underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2"
            >
              {strings.nav.signup}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
