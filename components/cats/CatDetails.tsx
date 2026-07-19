import React from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { strings, gendered } from '@/lib/strings'
import { Info, Coins, Stethoscope, Compass, ChevronLeft, Heart } from 'lucide-react'
import { AdminArchiveControl } from '@/components/admin/AdminArchiveControl'
import { CatGallery } from '@/components/cats/CatGallery'
import { ShareButtons } from '@/components/cats/ShareButtons'

interface CatPhoto {
  path_card: string
  path_full: string
  sort_order: number
}

interface Cat {
  id: string
  name: string
  sex: string
  birth_est: string
  region: string
  city: string | null
  is_special: boolean
  status: string
  video_path: string | null
  fee_amount: number | null
  description: string
  neutered: boolean | null
  vaccinations: number | null
  good_with_cats: boolean | null
  good_with_dogs: boolean | null
  health_notes: string | null
  special_needs: string | null
  cat_photos?: CatPhoto[] | null
}

interface CatDetailsProps {
  cat: Cat
  adoptionLink: string
  regionLabel: string
  ageLabel: string
  sexLabel: string
  isAdmin: boolean
}

export function CatDetails({
  cat,
  adoptionLink,
  regionLabel,
  ageLabel,
  sexLabel,
  isAdmin
}: CatDetailsProps) {
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
          <div className="md:col-span-6 space-y-6 bg-surface border border-border rounded-card p-6 md:p-8 shadow-resting text-start">
            
            {/* Header info */}
            <div className="flex flex-col gap-3 border-b border-border/60 pb-5">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl md:text-4xl font-display font-extrabold text-ink leading-tight">
                  {cat.name}
                </h1>
                
                {cat.is_special && (
                  <Badge variant="pending" className="flex items-center gap-1 font-bold">
                    <Heart className="w-3 h-3 fill-current" aria-hidden="true" />
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
                
                <Badge variant={(cat.vaccinations ?? 0) >= 2 ? 'adopted' : 'draft'} className="text-sm py-1.5 px-3">
                  {(cat.vaccinations ?? 0) === 0
                    ? gendered('catalog', 'vaccinesNone', cat.sex)
                    : (cat.vaccinations ?? 0) === 1
                    ? gendered('catalog', 'vaccinesOne', cat.sex)
                    : gendered('catalog', 'vaccinesMultiple', cat.sex).replace('{count}', (cat.vaccinations ?? 0).toString())}
                </Badge>
                
                {cat.good_with_cats === true && (
                  <Badge variant="adopted" className="text-sm py-1.5 px-3">
                    {gendered('catalog', 'goodWithCats', cat.sex)}
                  </Badge>
                )}
                {cat.good_with_cats === false && (
                  <Badge variant="rejected" className="text-sm py-1.5 px-3">
                    {gendered('catalog', 'goodWithCatsFalse', cat.sex)}
                  </Badge>
                )}
                {cat.good_with_cats === null && (
                  <Badge variant="draft" className="text-sm py-1.5 px-3">
                    {gendered('catalog', 'goodWithCatsNull', cat.sex)}
                  </Badge>
                )}

                {cat.good_with_dogs === true && (
                  <Badge variant="adopted" className="text-sm py-1.5 px-3">
                    {gendered('catalog', 'goodWithDogs', cat.sex)}
                  </Badge>
                )}
                {cat.good_with_dogs === false && (
                  <Badge variant="rejected" className="text-sm py-1.5 px-3">
                    {gendered('catalog', 'goodWithDogsFalse', cat.sex)}
                  </Badge>
                )}
                {cat.good_with_dogs === null && (
                  <Badge variant="draft" className="text-sm py-1.5 px-3">
                    {gendered('catalog', 'goodWithDogsNull', cat.sex)}
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

              <div className="pt-3 border-t border-border/40">
                <ShareButtons catId={cat.id} catName={cat.name} catSex={cat.sex} />
              </div>

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
