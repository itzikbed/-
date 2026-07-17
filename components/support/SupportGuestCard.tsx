'use client'

import React, { useRef } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { strings } from '@/lib/strings'
import { useDialogFocus } from './useDialogFocus'

// Shown when a signed-out visitor opens the chat launcher.
export function SupportGuestCard({ onClose }: { onClose: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null)
  useDialogFocus(true, onClose, cardRef)

  return (
    <div
      ref={cardRef}
      role="dialog"
      aria-modal="true"
      aria-label={strings.supportChat.guestTitle}
      className="fixed bottom-24 start-4 z-50 w-[min(20rem,calc(100vw-2rem))] bg-surface rounded-card shadow-hover border border-border p-5 space-y-3 text-start animate-fade-rise"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-display font-bold text-lg text-ink">{strings.supportChat.guestTitle}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label={strings.supportChat.closeChat}
          className="p-1 text-ink-soft hover:text-pine rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
      <p className="text-sm text-ink-soft leading-relaxed">{strings.supportChat.guestDesc}</p>
      <Link
        href="/login"
        className="block w-full text-center bg-marmalade text-ink hover:bg-marmalade-dp font-bold py-2.5 rounded-btn shadow-resting transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine"
      >
        {strings.supportChat.guestLoginBtn}
      </Link>
    </div>
  )
}
