import React from 'react'
import { strings } from '@/lib/strings'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: `${strings.compliance.terms.title} — ${strings.common.siteName}`,
  description: strings.common.metaDesc,
}

export default function TermsPage() {
  const content = strings.compliance.terms

  return (
    <div className="flex-grow bg-paper py-12 select-none">
      <div className="app-container max-w-3xl bg-surface border border-border rounded-card p-8 md:p-12 shadow-resting text-start space-y-6">
        <h1 className="text-3xl font-display font-extrabold text-ink border-b border-border/60 pb-4">
          {content.title}
        </h1>

        <p className="text-base text-ink leading-relaxed">
          {content.intro.replace('{siteName}', strings.common.siteName)}
        </p>

        <section className="space-y-3">
          <h2 className="text-xl font-display font-bold text-pine">{content.section1Title}</h2>
          <p className="text-base text-ink leading-relaxed">
            {content.section1Text.replace('{siteName}', strings.common.siteName)}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-display font-bold text-pine">{content.section2Title}</h2>
          <ul className="list-disc list-inside ps-4 text-base text-ink-soft space-y-2">
            <li>{content.useRule1}</li>
            <li>{content.useRule2}</li>
            <li>{content.useRule3}</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-display font-bold text-pine">{content.section3Title}</h2>
          <p className="text-base text-ink leading-relaxed">
            {content.section3Text}
          </p>
        </section>
      </div>
    </div>
  )
}
