import React from 'react'
import Link from 'next/link'
import { strings } from '@/lib/strings'
import { SleepingPose } from '@/components/mascot/SleepingPose'
import { SectionCurve } from '@/components/ui/SectionCurve'

const linkClass =
  'inline-block py-1 text-paper/80 hover:text-marmalade hover:underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marmalade'

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link href={href} className={linkClass}>
        {label}
      </Link>
    </li>
  )
}

/**
 * Site-wide anchor footer (DESIGN §5a): deep-pine band with the sleeping
 * Peeking Cat resting on the curve. Not dark mode — a closing anchor.
 */
export function Footer() {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL

  return (
    <footer className="mt-auto">
      <div className="relative">
        <div className="absolute bottom-0 end-10 md:end-24 text-ink select-none pointer-events-none">
          <SleepingPose width={96} height={64} />
        </div>
        <SectionCurve className="text-pine-deep" />
      </div>

      <div className="bg-pine-deep text-paper">
        <div className="app-container pt-8 pb-6 md:pt-10 md:pb-8">
          <div className="flex flex-col md:flex-row justify-between gap-8 md:gap-12">
            <div className="max-w-sm">
              <p className="font-display font-bold text-xl">{strings.common.siteName}</p>
              <p className="mt-2 text-sm text-paper/75 font-sans leading-relaxed">
                {strings.nav.footerTagline}
              </p>
            </div>

            <nav aria-label={strings.nav.footerNavLabel} className="flex gap-12 md:gap-16">
              <div>
                <p className="font-sans font-semibold text-sm text-paper/60 mb-3">
                  {strings.nav.footerSiteLinks}
                </p>
                <ul className="space-y-2 text-sm font-sans">
                  <FooterLink href="/cats" label={strings.nav.catalog} />
                  <FooterLink href="/publish" label={strings.nav.publish} />
                  <FooterLink href="/about" label={strings.nav.about} />
                </ul>
              </div>
              <div>
                <p className="font-sans font-semibold text-sm text-paper/60 mb-3">
                  {strings.nav.footerLegalLinks}
                </p>
                <ul className="space-y-2 text-sm font-sans">
                  <FooterLink href="/privacy" label={strings.nav.privacyPolicy} />
                  <FooterLink href="/accessibility" label={strings.nav.accessibilityDeclaration} />
                  <FooterLink href="/terms" label={strings.nav.terms} />
                </ul>
              </div>
            </nav>
          </div>

          {/* ps clearance keeps the fixed support-chat launcher (bottom-5 start-5) off the text */}
          <div className="mt-8 pt-5 border-t border-paper/15 flex flex-col md:flex-row items-center justify-between gap-3 ps-20 text-sm text-paper/60 font-sans">
            <p>
              &copy; {new Date().getFullYear()} {strings.common.siteName}.{' '}
              {strings.nav.allRightsReserved}
            </p>
            {contactEmail && (
              <p>
                {strings.common.support}:{' '}
                <a href={`mailto:${contactEmail}`} className={linkClass}>
                  {contactEmail}
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
