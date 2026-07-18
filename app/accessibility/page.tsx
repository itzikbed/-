import React from 'react'
import { strings } from '@/lib/strings'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: `${strings.nav.accessibilityDeclaration} — ${strings.common.siteName}`,
  description: strings.common.metaDesc,
}

export default function AccessibilityPage() {
  const content = strings.compliance.accessibility

  return (
    <div className="flex-grow bg-paper py-12">
      <div className="app-container max-w-3xl bg-surface border border-border rounded-card p-8 md:p-12 shadow-resting text-start space-y-6">
        <h1 className="text-3xl font-display font-extrabold text-ink border-b border-border/60 pb-4">
          {strings.nav.accessibilityDeclaration}
        </h1>

        <p className="text-base text-ink leading-relaxed">
          {content.intro.replace('{siteName}', strings.common.siteName)}
        </p>

        <section className="space-y-3">
          <h2 className="text-xl font-display font-bold text-pine">{content.standardsTitle}</h2>
          <p className="text-base text-ink leading-relaxed">
            {content.standardsText} <strong>{content.standardsLevel}</strong>.
          </p>
          <p className="text-base text-ink leading-relaxed">
            {content.auditText}<strong>{content.auditDate}</strong>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-display font-bold text-pine">{content.adjustmentsTitle}</h2>
          <ul className="list-disc list-inside ps-4 text-base text-ink-soft space-y-2">
            <li><strong>{content.keyboardTitle}</strong> {content.keyboardText}</li>
            <li><strong>{content.focusTitle}</strong> {content.focusText}</li>
            <li><strong>{content.contrastTitle}</strong> {content.contrastText}</li>
            <li><strong>{content.labelsTitle}</strong> {content.labelsText}</li>
            <li><strong>{content.motionTitle}</strong> {content.motionText}</li>
          </ul>
        </section>

        <p className="text-base text-ink leading-relaxed">
          {content.disclaimerText}
        </p>

        <section className="space-y-3">
          <h2 className="text-xl font-display font-bold text-pine">{content.coordinatorTitle}</h2>
          <p className="text-base text-ink leading-relaxed">
            {content.coordinatorText}
          </p>
          <p className="text-base text-ink leading-relaxed font-semibold">
            {content.coordinatorDetails}
          </p>
          <ul className="list-none ps-0 text-base text-ink-soft space-y-1">
            <li><strong>{content.nameLabel}</strong> {content.coordinatorName}</li>
            <li><strong>{content.emailLabel}</strong> <bdi className="dir-ltr select-all">{process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'cheirut@gmail.com'}</bdi></li>
          </ul>
        </section>
      </div>
    </div>
  )
}
