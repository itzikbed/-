import React from 'react'
import { strings } from '@/lib/strings'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: `${strings.nav.privacyPolicy} — ${strings.common.siteName}`,
  description: strings.common.metaDesc,
}

export default function PrivacyPage() {
  const content = strings.compliance.privacy

  return (
    <div className="flex-grow bg-paper py-12">
      <div className="app-container max-w-3xl bg-surface border border-border rounded-card p-8 md:p-12 shadow-resting text-start space-y-6">
        <h1 className="text-3xl font-display font-extrabold text-ink border-b border-border/60 pb-4">
          {strings.nav.privacyPolicy}
        </h1>

        <p className="text-base text-ink leading-relaxed">
          {content.intro.replace('{siteName}', strings.common.siteName)}
        </p>

        <p className="text-base text-ink leading-relaxed font-semibold">
          {content.operatorLine}
        </p>

        <p className="text-base text-ink leading-relaxed">
          {content.noticeText}
        </p>

        <section className="space-y-3">
          <h2 className="text-xl font-display font-bold text-pine">{content.section1Title}</h2>
          <p className="text-base text-ink leading-relaxed">
            {content.section1Intro}
          </p>
          <ul className="list-disc list-inside ps-4 text-base text-ink-soft space-y-2">
            <li>{content.infoUser}</li>
            <li>{content.infoPublisher}</li>
            <li>{content.infoAdopter}</li>
            <li>{content.infoSupport}</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-display font-bold text-pine">{content.section2Title}</h2>
          <p className="text-base text-ink leading-relaxed">
            {content.section2Intro}
          </p>
          <ul className="list-disc list-inside ps-4 text-base text-ink-soft space-y-2">
            <li>{content.useAdopter}</li>
            <li>{content.useContact}</li>
            <li>{content.useEmail}</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-display font-bold text-pine">{content.section3Title}</h2>
          <p className="text-base text-ink leading-relaxed">
            {content.section3Intro}
          </p>
          <ul className="list-disc list-inside ps-4 text-base text-ink-soft space-y-2">
            <li>{content.visibilityAdminOnly}</li>
            <li>{content.visibilityContact}</li>
            <li>{content.visibilityNoCommercial}</li>
            <li>{content.visibilityProcessors}</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-display font-bold text-pine">{content.section4Title}</h2>
          <p className="text-base text-ink leading-relaxed">
            {content.section4Text}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-display font-bold text-pine">{content.section5Title}</h2>
          <p className="text-base text-ink leading-relaxed">
            {content.section5CookiesText}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-display font-bold text-pine">{content.section6Title}</h2>
          <p className="text-base text-ink leading-relaxed">
            {content.section6Text}{' '}
            <bdi className="dir-ltr select-all text-pine font-semibold">
              {process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'cheirut@gmail.com'}
            </bdi>
          </p>
        </section>

        <p className="text-sm text-ink-soft pt-2 border-t border-border/60">
          {content.updatedLine}
        </p>
      </div>
    </div>
  )
}
