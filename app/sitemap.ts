import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  let catUrls: { url: string; lastModified: Date }[] = []
  try {
    const supabase = await createClient()
    const { data: cats } = await supabase
      .from('cats')
      .select('id, updated_at')
      .eq('status', 'published')

    if (cats) {
      catUrls = cats.map((cat) => ({
        url: `${siteUrl}/cats/${cat.id}`,
        lastModified: cat.updated_at ? new Date(cat.updated_at) : new Date(),
      }))
    }
  } catch (err) {
    console.error('Failed to generate sitemap URLs dynamically:', err)
  }

  const staticPages = [
    '',
    '/cats',
    '/privacy',
    '/accessibility',
    '/terms',
  ].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
  }))

  return [...staticPages, ...catUrls]
}
