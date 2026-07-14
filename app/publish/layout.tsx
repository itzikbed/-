import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

interface PublishLayoutProps {
  children: React.ReactNode
}

export default async function PublishLayout({ children }: PublishLayoutProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/publish')
  }

  return <>{children}</>
}
