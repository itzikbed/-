import React from 'react'
import { FACT_ICONS, type Fact } from './facts'

/**
 * The quiet form of the facts, for a page that is read rather than skimmed:
 * every fact at once, nothing moving. The moving band on the home page is
 * `FactsRotator`; both draw on the same content and the same icons.
 *
 * No frame and no card. What separates one fact from the next is the space
 * between them and the pine disc that opens each one.
 */
export function FactsList({ facts }: { facts: Fact[] }) {
  return (
    <ul className="mt-9 grid sm:grid-cols-2 gap-x-10 gap-y-8">
      {facts.map((fact, position) => {
        const Icon = FACT_ICONS[position % FACT_ICONS.length]
        return (
          <li key={fact.title} className="text-start reveal-on-scroll">
            <div className="flex items-center gap-3">
              <span className="inline-flex p-2.5 rounded-full bg-surface-solid text-pine shadow-resting">
                <Icon className="w-5 h-5" aria-hidden="true" />
              </span>
              <p className="font-display font-extrabold text-2xl text-pine leading-tight">
                {fact.figure}
              </p>
            </div>
            <h3 className="mt-3 font-display font-bold text-lg text-ink leading-snug">
              {fact.title}
            </h3>
            <p className="mt-1.5 text-sm text-ink-soft leading-relaxed">{fact.text}</p>
          </li>
        )
      })}
    </ul>
  )
}
