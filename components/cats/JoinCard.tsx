import React from 'react'
import Link from 'next/link'
import { Mascot } from '@/components/mascot/Mascot'
import { strings } from '@/lib/strings'

/**
 * Closing card for sparse cat grids (launch phase): keeps the row from
 * looking abandoned and recruits publishers on every visit.
 */
export function JoinCard() {
  return (
    <Link
      href="/publish"
      className="group rounded-card border-2 border-dashed border-pine/40 bg-surface/60 hover:bg-surface hover:border-pine/70 hover:-translate-y-0.5 transition-all duration-150 flex flex-col items-center justify-center text-center gap-3 p-6 min-h-64 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2"
    >
      <Mascot pose="sitting" width={64} height={77} />
      <h2 className="text-lg font-display font-bold text-ink leading-snug">
        {strings.home.joinCardTitle}
      </h2>
      <p className="text-sm text-ink-soft leading-relaxed max-w-52">
        {strings.home.joinCardDesc}
      </p>
      <span className="mt-1 inline-flex items-center justify-center font-sans font-semibold rounded-btn min-h-11 px-5 text-sm bg-pine text-white group-hover:bg-pine/90 transition-colors">
        {strings.home.joinCardBtn}
      </span>
    </Link>
  )
}
