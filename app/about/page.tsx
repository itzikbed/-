import React from 'react'
import { strings } from '@/lib/strings'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: `${strings.about.title} — ${strings.common.siteName}`,
  description: strings.about.metaDesc,
}

export default function AboutPage() {
  const content = strings.about

  const facts = [
    { title: content.fact1Title, text: content.fact1Text },
    { title: content.fact2Title, text: content.fact2Text },
    { title: content.fact3Title, text: content.fact3Text },
    { title: content.fact4Title, text: content.fact4Text },
  ]

  return (
    <div className="flex-grow bg-paper py-12">
      <div className="app-container max-w-3xl bg-surface border border-border rounded-card p-8 md:p-12 shadow-resting text-start space-y-6">
        <h1 className="text-3xl font-display font-extrabold text-ink border-b border-border/60 pb-4">
          {content.title}
        </h1>

        <p className="text-lg font-bold text-pine leading-relaxed">
          {content.welcome}
        </p>

        <p className="text-base text-ink leading-relaxed">
          {content.intro1}
        </p>

        <p className="text-base text-ink leading-relaxed">
          {content.intro2}
        </p>

        <section className="space-y-3">
          <h2 className="text-xl font-display font-bold text-pine">{content.factsTitle}</h2>
          <p className="text-base text-ink leading-relaxed">
            {content.factsIntro}
          </p>
          <ul className="list-disc list-inside ps-4 text-base text-ink-soft space-y-2">
            {facts.map((fact) => (
              <li key={fact.title}>
                <span className="font-bold text-ink">{fact.title}</span>{' '}
                {fact.text}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-display font-bold text-pine">{content.missionTitle}</h2>
          <p className="text-base text-ink leading-relaxed">
            {content.missionText}
          </p>
          <p className="text-base font-bold text-ink leading-relaxed">
            {content.ctaTitle}
          </p>
          <p className="text-base text-ink leading-relaxed">
            {content.ctaText}
          </p>
          <p className="text-lg font-display font-bold text-pine pt-2">
            {content.closing}
          </p>
        </section>
      </div>
    </div>
  )
}
