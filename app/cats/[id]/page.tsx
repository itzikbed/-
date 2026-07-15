import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CatGallery } from '@/components/cats/CatGallery'
import { REGIONS, RegionId } from '@/lib/constants'
import { getAgeBucketLabel } from '@/lib/utils/filters'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { strings, gendered } from '@/lib/strings'
import { Info, Coins, Stethoscope, Compass, ChevronLeft } from 'lucide-react'
import { AdminArchiveControl } from '@/components/admin/AdminArchiveControl'
import { getMediaUrl } from '@/lib/security/media'

interface CatDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: CatDetailPageProps) {
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
  const ogImageUrl = coverPhoto
    ? new URL(getMediaUrl(coverPhoto.path_full), process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').toString()
    : undefined

  const sexLabel = cat.sex === 'male' 
    ? strings.catalog.genderMale 
    : cat.sex === 'female' 
    ? strings.catalog.genderFemale 
    : strings.catalog.genderUnknown

  const title = gendered('catalog', 'detailTitle', cat.sex).replace('{name}', cat.name)

  const regionObj = REGIONS.find((r) => r.id === cat.region as RegionId)
  const regionLabel = regionObj ? regionObj.label : cat.region

  const description = strings.catalog.detailDescription
    .replace('{name}', cat.name)
    .replace('{sexLabel}', sexLabel)
    .replace('{regionLabel}', regionLabel)
    .replace('{description}', cat.description.substring(0, 120))

  return {
    title,
    description,
    openGraph: ogImageUrl
      ? {
          images: [{ url: ogImageUrl }]
        }
      : undefined
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
  const sexLabel = cat.sex === 'male' ? strings.catalog.genderMale : cat.sex === 'female' ? strings.catalog.genderFemale : strings.catalog.genderUnknown

  // Determine adoption link
  const adoptionLink = hasQuestionnaire
    ? `/cats/${cat.id}/request`
    : `/adopt/questionnaire?cat=${cat.id}`

  return (
    <div className="flex-grow bg-paper py-10 select-none">
      <div className="app-container max-w-5xl space-y-8">
        
        {/* Breadcrumbs */}
        <nav className="text-sm font-semibold text-ink-soft flex items-center gap-2">
          <Link href="/cats" className="hover:text-pine hover:underline">
            {strings.catalog.breadcrumbsTitle}
          </Link>
          <ChevronLeft className="w-4 h-4 text-ink-soft/60" />
          <span className="text-ink">{cat.name}</span>
        </nav>

        {/* Two-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Gallery Column (6 cols on md) */}
          <div className="md:col-span-6 space-y-6">
            <CatGallery photos={cat.cat_photos || []} catName={cat.name} catId={cat.id} videoPath={cat.video_path} />
          </div>

          {/* Details Column (6 cols on md) */}
          <div className="md:col-span-6 space-y-6 bg-surface border border-border rounded-card p-6 md:p-8 shadow-resting">
            
            {/* Header info */}
            <div className="flex flex-col gap-3 border-b border-border/60 pb-5">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl md:text-4xl font-display font-extrabold text-ink leading-tight">
                  {cat.name}
                </h1>
                
                {cat.is_special && (
                  <Badge variant="pending" className="flex items-center gap-1 font-bold">
                    <span>{strings.catalog.specialBadge}</span>
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-base font-semibold text-ink-soft">
                <span>{ageLabel}</span>
                <span>&middot;</span>
                <span>{sexLabel}</span>
                <span>&middot;</span>
                <span className="flex items-center gap-1">
                  <Compass className="w-4 h-4 text-ink-soft/80" />
                  {regionLabel} {cat.city ? `(${cat.city})` : ''}
                </span>
              </div>
            </div>

            <div className="rounded-input p-4 flex items-center justify-between bg-marmalade-sf border border-marmalade/20">
              <div className="flex items-center gap-2 text-ink">
                <Coins className="w-5 h-5 text-marmalade-dp" />
                <span className="text-base font-bold">{strings.catalog.feeLabel}</span>
              </div>
              <span className="text-lg font-display font-extrabold text-ink">
                {cat.fee_amount ? `₪${cat.fee_amount}` : strings.catalog.noFee}
              </span>
            </div>

            {/* Attributes List */}
            <div className="space-y-4">
              <h3 className="text-lg font-display font-bold text-ink flex items-center gap-2">
                <Info className="w-5 h-5 text-pine" />
                {strings.catalog.attributes}
              </h3>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant={cat.neutered ? 'adopted' : 'draft'} className="text-sm py-1.5 px-3">
                  {cat.neutered
                    ? gendered('catalog', 'neuteredTrue', cat.sex)
                    : gendered('catalog', 'neuteredFalse', cat.sex)}
                </Badge>
                
                <Badge variant={cat.vaccinations >= 2 ? 'adopted' : 'draft'} className="text-sm py-1.5 px-3">
                  {cat.vaccinations === 0
                    ? gendered('catalog', 'vaccinesNone', cat.sex)
                    : cat.vaccinations === 1
                    ? gendered('catalog', 'vaccinesOne', cat.sex)
                    : gendered('catalog', 'vaccinesMultiple', cat.sex).replace('{count}', cat.vaccinations.toString())}
                </Badge>
                
                {cat.good_with_cats && (
                  <Badge variant="adopted" className="text-sm py-1.5 px-3">
                    {gendered('catalog', 'goodWithCats', cat.sex)}
                  </Badge>
                )}

                {cat.good_with_dogs && (
                  <Badge variant="adopted" className="text-sm py-1.5 px-3">
                    {gendered('catalog', 'goodWithDogs', cat.sex)}
                  </Badge>
                )}
                
                {!cat.good_with_cats && !cat.good_with_dogs && (
                  <Badge variant="draft" className="text-sm py-1.5 px-3">
                    {gendered('catalog', 'goodWithNeither', cat.sex)}
                  </Badge>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3 pt-4 border-t border-border/40">
              <h3 className="text-lg font-display font-bold text-ink">{strings.catalog.aboutCat}</h3>
              <p className="text-base text-ink leading-relaxed whitespace-pre-line font-medium">
                {cat.description}
              </p>
            </div>

            {/* Health & Special Needs details */}
            {(cat.health_notes || (cat.is_special && cat.special_needs)) && (
              <div className="space-y-4 pt-4 border-t border-border/40">
                <h3 className="text-lg font-display font-bold text-ink flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-pine" />
                  {strings.catalog.healthAndNeeds}
                </h3>
                
                {cat.is_special && cat.special_needs && (
                  <div className="bg-marmalade-sf/40 border-s-4 border-marmalade p-3.5 rounded text-sm text-ink font-semibold">
                    <strong className="block mb-1 text-ink">{strings.catalog.specialNeedsLabel}</strong>
                    {cat.special_needs}
                  </div>
                )}
                
                {cat.health_notes && (
                  <div className="text-sm font-semibold text-ink-soft leading-relaxed">
                    <strong className="block text-ink mb-1">{strings.catalog.healthNotesLabel}</strong>
                    {cat.health_notes}
                  </div>
                )}
              </div>
            )}

            {/* Primary CTA */}
            <div className="pt-6 border-t border-border/40 space-y-3">
              <Link
                href={adoptionLink}
                className="w-full inline-flex items-center justify-center font-sans font-bold rounded-btn min-h-[48px] px-6 text-base bg-marmalade text-ink hover:bg-marmalade-dp transition-all duration-150 active:scale-98 shadow-resting hover:-translate-y-0.5"
              >
                {strings.catalog.adoptCta.replace('{name}', cat.name)}
              </Link>

              {isAdmin && (
                <div className="pt-2 border-t border-border/20">
                  <AdminArchiveControl catId={cat.id} />
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
