import React from 'react'
import Link from 'next/link'
import { Mascot } from '@/components/mascot/Mascot'
import { strings } from '@/lib/strings'

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center select-none app-container flex-grow">
      <div className="relative h-24 w-32 mb-6 overflow-visible flex items-end justify-center">
        <Mascot pose="sleeping" className="translate-y-2" />
      </div>
      <h2 className="text-3xl font-display font-extrabold text-ink mb-3">
        {strings.notFound.title}
      </h2>
      <p className="text-ink-soft text-base max-w-md mb-8 leading-relaxed font-semibold">
        {strings.notFound.desc}
      </p>
      <Link
        href="/cats"
        className="inline-flex items-center justify-center font-sans font-bold rounded-btn min-h-[48px] px-6 text-base bg-pine text-white hover:bg-pine/90 transition-colors shadow-resting active:scale-98"
      >
        {strings.notFound.backBtn}
      </Link>
    </div>
  )
}
