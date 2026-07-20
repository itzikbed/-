'use server'

import { createClient } from '@/lib/supabase/server'
import {
  forgotPasswordSchema,
  loginSchema,
  signupSchema,
  ForgotPasswordInput,
  LoginInput,
  SignupInput,
} from '@/lib/schemas/auth'
import { getTrustedSiteUrl } from '@/lib/utils/site-url'
import { revalidatePath } from 'next/cache'
import uiStrings from '@/content/he/ui.json'

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; formError?: string; fieldErrors?: Record<string, string[]> }

// Version of the terms+privacy pair the signup consent covers — bump this on
// EVERY change to either document (privacy last updated 2026-07-20).
const TERMS_VERSION = '2026-07-20'

function mapAuthError(message: string): string {
  const msg = message.toLowerCase()
  if (msg.includes('weak password') || msg.includes('should be at least') || msg.includes('password should be')) {
    return uiStrings.auth.weakPassword
  }
  if (msg.includes('email not confirmed')) {
    return uiStrings.auth.emailNotConfirmed
  }
  return uiStrings.auth.authFailedMsg
}

export async function loginAction(formData: LoginInput): Promise<ActionResult> {
  const result = loginSchema.safeParse(formData)
  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors
    return { ok: false, fieldErrors }
  }

  const { email, password, captchaToken } = result.data
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
    ...(captchaToken ? { options: { captchaToken } } : {}),
  })

  if (error) {
    return { ok: false, formError: mapAuthError(error.message) }
  }

  revalidatePath('/', 'layout')
  return { ok: true, data: { success: true } }
}

export async function signupAction(formData: SignupInput): Promise<ActionResult> {
  const result = signupSchema.safeParse(formData)
  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors
    return { ok: false, fieldErrors }
  }

  const { email, password, fullName, phone, captchaToken } = result.data
  const supabase = await createClient()

  let emailRedirectTo: string
  try {
    emailRedirectTo = getTrustedSiteUrl('/api/auth/callback?next=/')
  } catch {
    console.error('Invalid NEXT_PUBLIC_SITE_URL configuration')
    return { ok: false, formError: uiStrings.auth.authFailedMsg }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
      ...(captchaToken ? { captchaToken } : {}),
      data: {
        full_name: fullName,
        phone,
        terms_version: TERMS_VERSION,
        consented_at: new Date().toISOString(),
      },
    },
  })

  if (error) {
    const message = error.message.toLowerCase()
    if (message.includes('already registered') || message.includes('already exists')) {
      return { ok: true, data: { success: true, needsConfirmation: true } }
    }
    return { ok: false, formError: mapAuthError(error.message) }
  }

  return { ok: true, data: { success: true, needsConfirmation: !data.session } }
}

export async function forgotPasswordAction(formData: ForgotPasswordInput): Promise<ActionResult> {
  const result = forgotPasswordSchema.safeParse(formData)
  if (!result.success) {
    return { ok: false, formError: uiStrings.auth.invalidEmailInput }
  }

  const { email, captchaToken } = result.data
  const supabase = await createClient()
  
  let redirectUrl: string
  try {
    redirectUrl = getTrustedSiteUrl('/api/auth/callback?next=/reset-password')
  } catch {
    console.error('Invalid NEXT_PUBLIC_SITE_URL configuration')
    return { ok: false, formError: uiStrings.auth.authFailedMsg }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
    ...(captchaToken ? { captchaToken } : {}),
  })

  if (error) {
    return { ok: false, formError: uiStrings.auth.forgotPasswordError }
  }

  return { ok: true, data: { success: true } }
}

export async function resetPasswordAction(password: string): Promise<ActionResult> {
  if (!password || password.length < 8) {
    return { ok: false, formError: 'הסיסמה חייבת להכיל לפחות 8 תווים' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    password
  })

  if (error) {
    return { ok: false, formError: 'אירעה שגיאה בעדכון הסיסמה. ייתכן שפג תוקפו של קישור השחזור.' }
  }

  return { ok: true, data: { success: true } }
}
