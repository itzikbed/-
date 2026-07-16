import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { REGIONS, RegionId } from '@/lib/constants'
import { getAgeBucketLabel } from '@/lib/utils/age-bucket'
import { strings, gendered } from '@/lib/strings'
import { CatDetails } from '@/components/cats/CatDetails'
import type { Metadata } from 'next'

interface CatDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: CatDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: cat } = await supabase
    .from('cats')
    .select('*, cat_photos(*)')
    .eq('id', id)
    .single()

  if (!cat || cat.status !== 'published') {
    return {
      title: strings.common.metaTitle
    }
  }

  const coverPhoto = cat.cat_photos?.find((p) => p.sort_order === 0) || cat.cat_photos?.[0]
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://homeforcats.org'
  const ogImageUrl = coverPhoto
    ? `${siteUrl}/api/media?path=${encodeURIComponent(coverPhoto.path_card)}`
    : undefined

  const sexLabel = cat.sex === 'male' 
    ? strings.catalog.genderMale 
    : cat.sex === 'female' 
    ? strings.catalog.genderFemale 
    : strings.catalog.genderUnknown

  const title = gendered('catalog', 'detailTitle', cat.sex).replace('{name}', cat.name)

  const regionObj = REGIONS.find((r) => r.id === cat.region as RegionId)
  const regionLabel = regionObj ? regionObj.label : cat.region

  const description = gendered('catalog', 'detailDescription', cat.sex)
    .replace('{name}', cat.name)
    .replace('{sexLabel}', sexLabel)
    .replace('{regionLabel}', regionLabel)
    .replace('{description}', cat.description.substring(0, 120))

  return {
    title,
    description,
    alternates: {
      canonical: `/cats/${id}`
    },
    openGraph: {
      title,
      description,
      type: 'website',
      images: ogImageUrl ? [{ url: ogImageUrl }] : undefined
    }
  }
}

export default async function CatDetailPage({ params }: CatDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch cat details with photos
  const { data: cat } = await supabase
    .from('cats')
    .select('*, cat_photos(*)')
    .eq('id', id)
    .single()

  // non-published cats or non-existent cats return notFound
  if (!cat || cat.status !== 'published') {
    notFound()
  }

  // Check if current user has a completed questionnaire and if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  let hasQuestionnaire = false
  let isAdmin = false
  if (user) {
    const [adopterRes, profileRes] = await Promise.all([
      supabase.from('adopter_profiles').select('completed_at').eq('user_id', user.id).maybeSingle(),
      supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    ])
    hasQuestionnaire = !!adopterRes.data?.completed_at
    isAdmin = profileRes.data?.role === 'admin'
  }

  // Look up region label
  const regionObj = REGIONS.find((r) => r.id === cat.region as RegionId)
  const regionLabel = regionObj ? regionObj.label : cat.region

  // Age label
  const ageLabel = getAgeBucketLabel(cat.birth_est)
  const sexLabel = cat.sex === 'male' 
    ? strings.catalog.genderMale 
    : cat.sex === 'female' 
    ? strings.catalog.genderFemale 
    : strings.catalog.genderUnknown

  // Determine adoption link
  const adoptionLink = hasQuestionnaire
    ? `/cats/${cat.id}/request`
    : `/adopt/questionnaire?cat=${cat.id}`

  // Compute OG image for JSON-LD
  const coverPhoto = cat.cat_photos?.find((p: { sort_order: number }) => p.sort_order === 0) || cat.cat_photos?.[0]
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://homeforcats.org'
  const ogImageUrl = coverPhoto
    ? `${siteUrl}/api/media?path=${encodeURIComponent(coverPhoto.path_card)}`
    : undefined

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': cat.name,
    'description': cat.description.substring(0, 200),
    'image': ogImageUrl || undefined,
    'offers': {
      '@type': 'Offer',
      'price': cat.fee_amount || 0,
      'priceCurrency': 'ILS',
      'availability': 'https://schema.org/InStock'
    }
  }

  return (
    <>
      <CatDetails
        cat={cat}
        adoptionLink={adoptionLink}
        regionLabel={regionLabel}
        ageLabel={ageLabel}
        sexLabel={sexLabel}
        isAdmin={isAdmin}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  )
}
