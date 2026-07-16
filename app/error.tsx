'use client'

import React, { useEffect } from 'react'
import { Mascot } from '@/components/mascot/Mascot'
import { strings } from '@/lib/strings'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('App level error boundary:', error.message, error.digest)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center select-none app-container flex-grow">
      <div className="relative h-24 w-32 mb-6 overflow-visible flex items-end justify-center">
        <Mascot pose="sleeping" className="translate-y-2" />
      </div>
      <h2 className="text-3xl font-display font-extrabold text-ink mb-3">
        {strings.error.title}
      </h2>
      <p className="text-ink-soft text-base max-w-md mb-8 leading-relaxed font-semibold">
        {strings.error.desc}
      </p>
      <button
        onClick={() => reset()}
        className="inline-flex items-center justify-center font-sans font-bold rounded-btn min-h-[48px] px-6 text-base bg-marmalade text-ink hover:bg-marmalade-dp transition-colors shadow-resting active:scale-98 cursor-pointer"
      >
        {strings.error.retryBtn}
      </button>
    </div>
  )
}
