import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') throw new Error('Unauthorized')
  return user.id
}

export async function getUserEmail(userId: string): Promise<string> {
  // Defense-in-depth: this uses the service role to read any user's email, so it
  // must independently confirm the caller is an admin (not rely on call sites).
  await checkAdmin()
  const supabaseService = createAdminClient()
  const { data, error } = await supabaseService.auth.admin.getUserById(userId)
  if (error || !data.user || !data.user.email) {
    throw new Error('Failed to fetch user email')
  }
  return data.user.email
}
