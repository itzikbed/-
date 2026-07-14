import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { strings } from '@/lib/strings'
import { CatUploadWizard } from '@/components/cats/CatUploadWizard'
import { ChevronRight } from 'lucide-react'

interface EditCatPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: EditCatPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: cat } = await supabase
    .from('cats')
    .select('name')
    .eq('id', id)
    .single()

  return {
    title: cat ? `עריכת מודעה של ${cat.name} — בית לחתול` : 'עריכת מודעה — בית לחתול'
  }
}

export default async function EditCatPage({ params }: EditCatPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirect=/publish/edit/${id}`)
  }

  // Fetch profiles row for user
  const { data: profile } = await supabase
    .from('profiles')
    .select('publisher_status, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.publisher_status !== 'approved') {
    redirect('/publish')
  }

  // Fetch cat details with photos
  const { data: cat } = await supabase
    .from('cats')
    .select('*, cat_photos(*)')
    .eq('id', id)
    .single()

  if (!cat) {
    notFound()
  }

  // Check ownership
  if (cat.owner_id !== user.id && profile.role !== 'admin') {
    redirect('/publish/my-cats')
  }

  return (
    <div className="flex-grow bg-paper py-10 select-none">
      <div className="app-container max-w-2xl space-y-6">
        
        {/* Navigation & Header */}
        <div className="space-y-1">
          <nav className="text-sm font-semibold text-ink-soft flex items-center gap-1.5">
            <Link href="/" className="hover:text-pine hover:underline">
              {strings.nav.home}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            <Link href="/publish/my-cats" className="hover:text-pine hover:underline">
              {strings.publish.myCats}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            <span className="text-ink">{strings.publish.editCatTitle.replace('{name}', cat.name)}</span>
          </nav>
          <h1 className="text-3xl font-display font-extrabold text-ink">
            {strings.publish.editCatTitle.replace('{name}', cat.name)}
          </h1>
        </div>

        {/* Wizard Card */}
        <CatUploadWizard initialCat={cat} />

      </div>
    </div>
  )
}
