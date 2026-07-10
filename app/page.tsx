import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Mascot } from '@/components/mascot/mascot'
import { strings } from '@/lib/strings'

export default function HomePage() {
  return (
    <div className="flex flex-col flex-grow">
      {/* Full-bleed Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center py-20 select-none overflow-hidden">
        {/* Background Image with Art-directed warm crop */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero_cat.png"
            alt="חתול ג'ינג'י יפהפה בבית חם"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          {/* Ink-tinted Gradient Overlay for Text Contrast (bottom->top in RTL reading flow) */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/35 to-transparent" />
        </div>

        {/* Hero Content Container */}
        <div className="app-container relative z-10 w-full flex flex-col items-center text-center gap-12 mt-8">
          <div className="space-y-4 max-w-3xl animate-fade-rise">
            <h1 className="text-4xl md:text-6xl font-display font-extrabold text-surface tracking-tight leading-none drop-shadow-md">
              {strings.common.siteSubtitle}.
            </h1>
            <p className="text-lg md:text-xl font-sans text-paper/90 max-w-xl mx-auto drop-shadow-sm leading-relaxed">
              פלטפורמה ארצית מפוקחת ומאובטחת לאימוץ ומסירת חתולים. כל החתולים באתר עוברים בדיקה ואישור מנהל.
            </p>
          </div>

          {/* Two-Door Hero Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mt-4">
            
            {/* Door 1: Adopt (Marmalade treatments) */}
            <div className="relative group bg-surface rounded-card border border-border shadow-resting hover:shadow-hover hover:-translate-y-1 transition-all duration-150 p-8 flex flex-col justify-between items-center text-center gap-6 cursor-pointer">
              {/* Mascot Peeking on Hover */}
              <div className="absolute bottom-full inset-inline-start-1/2 -translate-x-1/2 translate-y-3 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 pointer-events-none z-20">
                <Mascot pose="peek" />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-2xl font-display font-bold text-ink">רוצה לאמץ חתול</h3>
                <p className="text-base text-ink-soft leading-relaxed max-w-xs">
                  מצא את החבר הבא שלך. סנן לפי אזור, גיל, מיוחדים ועוד.
                </p>
              </div>
              <Link href="/cats" className="w-full">
                <Button variant="primary" className="w-full pointer-events-none">
                  למאגר החתולים לאימוץ
                </Button>
              </Link>
            </div>

            {/* Door 2: Publish (Pine Treatments) */}
            <div className="relative group bg-surface rounded-card border border-border shadow-resting hover:shadow-hover hover:-translate-y-1 transition-all duration-150 p-8 flex flex-col justify-between items-center text-center gap-6 cursor-pointer">
              {/* Mascot Peeking on Hover */}
              <div className="absolute bottom-full inset-inline-start-1/2 -translate-x-1/2 translate-y-3 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 pointer-events-none z-20">
                <Mascot pose="peek" />
              </div>

              <div className="space-y-3">
                <h3 className="text-2xl font-display font-bold text-ink">מחפש בית לחתול</h3>
                <p className="text-base text-ink-soft leading-relaxed max-w-xs">
                  פרסם מודעה חדשה למסירה. פרסום המודעות מותנה באישור מנהלי.
                </p>
              </div>
              <Link href="/publish" className="w-full">
                <Button variant="secondary" className="w-full pointer-events-none">
                  הגשת מודעת מסירה
                </Button>
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* Latest Cats Section */}
      <section className="py-16 md:py-24 bg-paper">
        <div className="app-container text-start">
          <div className="flex flex-col gap-2 mb-10">
            <h2 className="text-3xl font-display font-extrabold text-ink">
              חתולים חדשים שמחפשים בית
            </h2>
            <p className="text-ink-soft text-base">חתולים חמודים שנקלטו במערכת לאחרונה וממתינים למשפחה אוהבת.</p>
          </div>

          {/* Skeleton Grid representing future dynamically loaded content */}
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
            <Link href="/cats">
              <Button variant="tertiary" className="text-pine font-bold">
                צפה בכל החתולים לאימוץ &larr;
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
