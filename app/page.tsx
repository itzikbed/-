import Link from 'next/link'
import Image from 'next/image'
import { Mascot } from '@/components/mascot/Mascot'
import { strings } from '@/lib/strings'

export default function HomePage() {
  return (
    <div className="flex flex-col flex-grow">
      {/* Full-bleed Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center py-20 select-none overflow-hidden">
        {/* Background Image with Art-directed crop */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero_cat.png"
            alt={strings.home.heroImageAlt}
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          {/* Gradient Overlay for Text Contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/35 to-transparent" />
        </div>

        {/* Hero Content Container */}
        <div className="app-container relative z-10 w-full flex flex-col items-center text-center gap-12 mt-8">
          <div className="space-y-4 max-w-3xl animate-fade-rise">
            <h1 className="text-4xl md:text-6xl font-display font-extrabold text-surface tracking-tight leading-none drop-shadow-md">
              {strings.common.siteSubtitle}.
            </h1>
            <p className="text-lg md:text-xl font-sans text-paper/90 max-w-xl mx-auto drop-shadow-sm leading-relaxed">
              {strings.home.heroDesc}
            </p>
          </div>

          {/* Two-Door Hero Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mt-4">
            
            {/* Door 1: Adopt */}
            <Link 
              href="/cats" 
              className="relative group bg-surface rounded-card border border-border shadow-resting hover:shadow-hover hover:-translate-y-1 transition-all duration-150 p-8 flex flex-col justify-between items-center text-center gap-6 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2"
            >
              {/* Mascot Peeking on Hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 translate-y-3 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 pointer-events-none z-20">
                <Mascot pose="peek" />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-2xl font-display font-bold text-ink">{strings.home.adoptTitle}</h3>
                <p className="text-base text-ink-soft leading-relaxed max-w-xs">
                  {strings.home.adoptDesc}
                </p>
              </div>
              
              {/* Styled Div mimicking primary button */}
              <div className="w-full inline-flex items-center justify-center font-sans font-semibold rounded-btn min-h-[48px] px-6 text-base bg-marmalade text-ink group-hover:bg-marmalade-dp transition-colors shadow-resting">
                {strings.home.adoptBtn}
              </div>
            </Link>

            {/* Door 2: Publish */}
            <Link 
              href="/publish" 
              className="relative group bg-surface rounded-card border border-border shadow-resting hover:shadow-hover hover:-translate-y-1 transition-all duration-150 p-8 flex flex-col justify-between items-center text-center gap-6 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2"
            >
              {/* Mascot Peeking on Hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 translate-y-3 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 pointer-events-none z-20">
                <Mascot pose="peek" />
              </div>

              <div className="space-y-3">
                <h3 className="text-2xl font-display font-bold text-ink">{strings.home.publishTitle}</h3>
                <p className="text-base text-ink-soft leading-relaxed max-w-xs">
                  {strings.home.publishDesc}
                </p>
              </div>

              {/* Styled Div mimicking secondary button with Tailwind v4 bg-pine/90 */}
              <div className="w-full inline-flex items-center justify-center font-sans font-semibold rounded-btn min-h-[48px] px-6 text-base bg-pine text-white group-hover:bg-pine/90 transition-colors shadow-resting">
                {strings.home.publishBtn}
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* Latest Cats Section */}
      <section className="py-16 md:py-24 bg-paper">
        <div className="app-container text-start">
          <div className="flex flex-col gap-2 mb-10">
            <h2 className="text-3xl font-display font-extrabold text-ink">
              {strings.home.latestTitle}
            </h2>
            <p className="text-ink-soft text-base">
              {strings.home.latestDesc}
            </p>
          </div>

          {/* Skeleton Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((id) => (
              <div key={id} className="bg-surface border border-border rounded-card p-4 space-y-4">
                {/* Photo Skeleton */}
                <div className="animate-pulse bg-border rounded-photo aspect-[4/3] w-full" />
                {/* Text Skeletons */}
                <div className="space-y-2">
                  <div className="animate-pulse bg-border h-6 w-1/3 rounded" />
                  <div className="animate-pulse bg-border h-4 w-2/3 rounded" />
                </div>
                {/* Badge Skeleton */}
                <div className="animate-pulse bg-border h-8 w-1/2 rounded-full" />
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-12">
            <Link 
              href="/cats"
              className="inline-flex items-center justify-center font-sans font-semibold rounded-btn transition-all duration-150 ease-out active:scale-98 min-h-[48px] px-6 text-base select-none cursor-pointer bg-transparent text-pine hover:bg-pine-soft hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2"
            >
              {strings.home.viewAllBtn}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
