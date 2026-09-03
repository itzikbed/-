import React from 'react'
import { strings } from '@/lib/strings'
import { FactsList } from '@/components/ui/FactsList'
import { FactsRotator } from '@/components/ui/FactsRotator'
import { Whisker } from '@/components/ui/Whisker'

interface FactsSectionProps {
  /** The home page gets the band that changes on its own; the about page reads. */
  moving?: boolean
}

/**
 * "Cats in Israel: a few numbers and facts" — the heading, the facts and the
 * citation, in the two forms the site uses them. The band colour and its
 * spacing belong to the page, so both callers wrap this in their own section.
 *
 * The citation is not decoration. The figures are the Ministry of Agriculture's
 * own estimates as collected by the Knesset research review, and a number on a
 * page that cannot be traced back is a number nobody has to believe.
 */
export function FactsSection({ moving = false }: FactsSectionProps) {
  const facts = strings.facts

  return (
    <div className="app-container max-w-4xl">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h2 className="text-2xl md:text-3xl font-display font-extrabold text-ink">
          {facts.title}
        </h2>
        <Whisker className="mx-auto" />
        <p className="text-base text-ink-soft leading-relaxed">{facts.intro}</p>
      </div>

      {moving ? (
        <FactsRotator
          facts={facts.items}
          labels={{
            region: facts.regionLabel,
            pause: facts.pauseLabel,
            play: facts.playLabel,
            goTo: facts.goToLabel,
          }}
        />
      ) : (
        <FactsList facts={facts.items} />
      )}

      <p className="mt-8 text-center text-sm text-ink-soft leading-relaxed">
        {facts.sourceText}{' '}
        <a
          href={facts.sourceHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={facts.sourceLinkA11y}
          className="text-pine font-semibold underline underline-offset-2 hover:text-pine-deep rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine"
        >
          {facts.sourceLink}
        </a>
      </p>
    </div>
  )
}
