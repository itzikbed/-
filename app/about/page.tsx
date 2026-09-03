import React from 'react'
import Link from 'next/link'
import { strings } from '@/lib/strings'
import { Mascot } from '@/components/mascot/Mascot'
import { FactsRotator } from '@/components/ui/FactsRotator'
import { SectionCurve } from '@/components/ui/SectionCurve'
import { Whisker } from '@/components/ui/Whisker'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: `${strings.about.title} — ${strings.common.siteName}`,
  description: strings.about.metaDesc,
}

export default function AboutPage() {
  const content = strings.about

  return (
    <div className="flex-grow">
      {/* Intro */}
      <section className="pt-12 pb-8">
        <div className="app-container max-w-3xl flex flex-col items-center text-center gap-4">
          <Mascot pose="sitting" animateOnScroll={true} />
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-ink">
            {content.title}
          </h1>
          <Whisker className="mx-auto" />
          <p className="text-xl font-bold text-pine leading-relaxed">{content.welcome}</p>
          <div className="text-start space-y-4 pt-2">
            <p className="text-base text-ink leading-relaxed">{content.intro1}</p>
            <p className="text-base text-ink leading-relaxed">{content.intro2}</p>
          </div>
        </div>
      </section>

      {/* Mission + closing */}
      <section className="pt-6 pb-14">
        <div className="app-container max-w-3xl text-center">
          <h2 className="text-2xl md:text-3xl font-display font-extrabold text-ink">
            {content.missionTitle}
          </h2>
          <p className="text-base text-ink leading-relaxed mt-4">
            {content.missionText}
          </p>

          <div className="mt-10 space-y-3">
            <p className="text-lg font-display font-bold text-ink">{content.ctaTitle}</p>
            <p className="text-base text-ink-soft leading-relaxed">{content.ctaText}</p>
          </div>

          <p className="text-3xl md:text-4xl font-display font-extrabold text-pine mt-10">
            {content.closing}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Link
              href="/cats"
              className="inline-flex items-center justify-center font-sans font-bold rounded-btn min-h-12 px-7 text-base bg-marmalade text-ink hover:bg-marmalade-dp transition-all duration-150 active:scale-98 shadow-resting"
            >
              {content.ctaBrowseBtn}
            </Link>
            <Link
              href="/publish"
              className="inline-flex items-center justify-center font-sans font-bold rounded-btn min-h-12 px-7 text-base border-2 border-pine text-pine hover:bg-pine-soft transition-all duration-150 active:scale-98"
            >
              {content.ctaPublishBtn}
            </Link>
          </div>
        </div>
      </section>

      {/* Facts band — the last thing before the footer anchor */}
      <SectionCurve className="text-pine-soft" />
      <section className="bg-pine-soft paper-grain pt-8 pb-14 md:pb-16">
        <div className="app-container max-w-4xl">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl md:text-3xl font-display font-extrabold text-ink">
              {content.factsTitle}
            </h2>
            <Whisker className="mx-auto" />
            <p className="text-base text-ink-soft leading-relaxed">{content.factsIntro}</p>
          </div>

          <FactsRotator
            facts={content.facts}
            labels={{
              region: content.factsRegionLabel,
              pause: content.factsPauseLabel,
              play: content.factsPlayLabel,
              goTo: content.factsGoToLabel,
            }}
          />

          <p className="mt-6 text-center text-sm text-ink-soft leading-relaxed">
            {content.factsSourceText}{' '}
            <a
              href={content.factsSourceHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={content.factsSourceLinkA11y}
              className="text-pine font-semibold underline underline-offset-2 hover:text-pine-deep rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine"
            >
              {content.factsSourceLink}
            </a>
          </p>
        </div>
      </section>
    </div>
  )
}
