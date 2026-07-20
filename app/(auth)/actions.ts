'use server'

import { createClient } from '@/lib/supabase/server'
import { loginSchema, signupSchema, LoginInput, SignupInput } from '@/lib/schemas/auth'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import uiStrings from '@/content/he/ui.json'

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; formError?: string; fieldErrors?: Record<string, string[]> }

function mapAuthError(message: string): string {
  const msg = message.toLowerCase()
  if (msg.includes('weak password') || msg.includes('should be at least') || msg.includes('password should be')) {
    return uiStrings.auth.weakPassword
  }
  if (msg.includes('email not confirmed')) {
    return uiStrings.auth.emailNotConfirmed
  }
  if (msg.includes('already registered') || msg.includes('already exists')) {
    return uiStrings.auth.emailExists
  }
  return uiStrings.auth.authFailedMsg
}

export async function loginAction(formData: LoginInput): Promise<ActionResult> {
  const result = loginSchema.safeParse(formData)
  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors
    return { ok: false, fieldErrors }
  }

  const { email, password } = result.data
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
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

  const { email, password, fullName, phone } = result.data
  const supabase = await createClient()

  // Land the confirmation link on the code-exchange callback so the user
  // returns signed in instead of dropping on the homepage with a dead token.
  const headersList = await headers()
  const host = headersList.get('host')
  const protocol = host?.includes('localhost') || host?.includes('127.0.0.1') ? 'http' : 'https'

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${protocol}://${host}/api/auth/callback?next=/`,
      data: {
        full_name: fullName,
        phone,
      },
    },
  })

  if (error) {
    return { ok: false, formError: mapAuthError(error.message) }
  }

  // With confirmations on, Supabase obfuscates an existing confirmed email as a
  // success whose user carries no identities — surface it as a duplicate.
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return { ok: false, formError: uiStrings.auth.emailExists }
  }

  return { ok: true, data: { success: true, needsConfirmation: !data.session } }
}

export async function forgotPasswordAction(email: string): Promise<ActionResult> {
  if (!email || !email.includes('@')) {
    return { ok: false, formError: 'אנא הזן כתובת אימייל תקינה' }
  }

  const supabase = await createClient()
  
  // Construct the redirect URL for reset password token landing page
  const headersList = await headers()
  const host = headersList.get('host')
  const protocol = host?.includes('localhost') || host?.includes('127.0.0.1') ? 'http' : 'https'
  const redirectUrl = `${protocol}://${host}/api/auth/callback?next=/reset-password`

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl
  })

  if (error) {
    return { ok: false, formError: 'אירעה שגיאה בשליחת קישור השחזור. אנא נסו שנית.' }
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

