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
  const supabaseService = createAdminClient()
  const { data, error } = await supabaseService.auth.admin.getUserById(userId)
  if (error || !data.user || !data.user.email) {
    throw new Error(`Failed to fetch email for user ${userId}`)
  }
  return data.user.email
}
