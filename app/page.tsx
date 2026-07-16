import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Mascot } from '@/components/mascot/Mascot'
import { CatGrid } from '@/components/cats/CatGrid'
import { HeroFilm } from '@/components/ui/HeroFilm'
import { strings } from '@/lib/strings'
import { Heart, Sparkles } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: `${strings.common.siteName} — ${strings.common.siteSubtitle}`,
  description: strings.common.metaDesc,
  openGraph: {
    title: `${strings.common.siteName} — ${strings.common.siteSubtitle}`,
    description: strings.common.metaDesc,
    type: 'website',
  }
}

export default async function HomePage() {
  const supabase = await createClient()
  
  // Fetch 4 newest published cats from database
  const { data: latestCats } = await supabase
    .from('cats')
    .select('*, cat_photos(*)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(4)

  const displayCats = latestCats || []

  return (
    <div className="flex flex-col flex-grow select-none">
      {/* Full-bleed Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center py-20 overflow-hidden">
        <HeroFilm />

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
              {/* Mascot Peeking on Hover (200ms transform animation) */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 translate-y-3 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 pointer-events-none z-20">
                <Mascot pose="peek" />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-2xl font-display font-bold text-ink">{strings.home.adoptTitle}</h3>
                <p className="text-base text-ink-soft leading-relaxed max-w-xs">
                  {strings.home.adoptDesc}
                </p>
              </div>
              
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

              <div className="w-full inline-flex items-center justify-center font-sans font-semibold rounded-btn min-h-[48px] px-6 text-base bg-pine text-white group-hover:bg-pine/90 transition-colors shadow-resting">
                {strings.home.publishBtn}
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* Latest Cats Section */}
      <section className="py-16 md:py-24 bg-paper sunbeam-bg relative overflow-hidden">
        <div className="app-container text-start relative z-10">
          <div className="relative flex flex-col gap-2 mb-10 max-w-xl">
            {/* Alive touch: organic background blob shape behind heading */}
            <div className="absolute -z-10 w-36 h-36 bg-pine-soft rounded-full opacity-40 blur-xl pointer-events-none -translate-x-10 -translate-y-6" />
            
            <h2 className="text-3xl font-display font-extrabold text-ink">
              {strings.home.latestTitle}
            </h2>
            <p className="text-ink-soft text-base">
              {strings.home.latestDesc}
            </p>
          </div>

          {/* Dynamic Cat Grid */}
          <CatGrid cats={displayCats} />

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

      {/* How it works Section */}
      <section className="py-16 md:py-24 bg-surface border-t border-border relative overflow-hidden">
        <div className="app-container relative z-10">
          <div className="relative flex flex-col items-center text-center gap-2 mb-16 max-w-xl mx-auto">
            {/* Alive touch: organic background blob shape behind section heading */}
            <div className="absolute -z-10 w-44 h-44 bg-marmalade-sf rounded-full opacity-40 blur-xl pointer-events-none translate-x-12 -translate-y-6" />
            
            {/* Draw-on Mascot sitting next to/above title */}
            <Mascot pose="sitting" animateOnScroll={true} className="mb-2" />
            
            <h2 className="text-3xl font-display font-extrabold text-ink">
              {strings.home.howItWorksTitle}
            </h2>
            <p className="text-ink-soft text-base leading-relaxed">
              {strings.home.howItWorksDesc}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            
            {/* Adopter track */}
            <div className="bg-paper rounded-card border border-border p-8 space-y-8 shadow-resting">
              <div className="flex items-center gap-3 border-b border-border/60 pb-4">
                <div className="p-2.5 rounded-full bg-marmalade-sf text-marmalade-dp">
                  <Heart className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-display font-bold text-ink">
                  {strings.home.adopterStepsTitle}
                </h3>
              </div>
              
              <ol className="space-y-6">
                {strings.home.adopterSteps.map((step, idx) => (
                  <li key={idx} className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-marmalade text-ink font-display font-extrabold flex items-center justify-center text-sm shadow-resting">
                      {idx + 1}
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-lg font-display font-bold text-ink">{step.title}</h4>
                      <p className="text-sm font-semibold text-ink-soft leading-relaxed">{step.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Publisher track */}
            <div className="bg-paper rounded-card border border-border p-8 space-y-8 shadow-resting">
              <div className="flex items-center gap-3 border-b border-border/60 pb-4">
                <div className="p-2.5 rounded-full bg-pine-soft text-pine">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-display font-bold text-ink">
                  {strings.home.publisherStepsTitle}
                </h3>
              </div>
              
              <ol className="space-y-6">
                {strings.home.publisherSteps.map((step, idx) => (
                  <li key={idx} className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-pine text-white font-display font-extrabold flex items-center justify-center text-sm shadow-resting">
                      {idx + 1}
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-lg font-display font-bold text-ink">{step.title}</h4>
                      <p className="text-sm font-semibold text-ink-soft leading-relaxed">{step.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

          </div>
        </div>
      </section>
    </div>
  )
}
