'use server'

import { createClient } from '@/lib/supabase/server'
import { loginSchema, signupSchema, LoginInput, SignupInput } from '@/lib/schemas/auth'
import { revalidatePath } from 'next/cache'

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; formError?: string; fieldErrors?: Record<string, string[]> }

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
    return { ok: false, formError: 'פרטי ההתחברות אינם נכונים' }
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

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
      },
    },
  })

  if (error) {
    return { ok: false, formError: error.message || 'לא ניתן היה לבצע הרשמה' }
  }

  return { ok: true, data: { success: true } }
}
