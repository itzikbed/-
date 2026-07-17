'use client'

import React, { useEffect, useRef } from 'react'
import { Skeleton } from '@/components/ui/Skeleton'
import { strings } from '@/lib/strings'
import { formatMessageTime, SupportMessage } from '@/lib/support/chat'

interface SupportMessagesProps {
  messages: SupportMessage[] | null
  viewerId: string
  emptyTitle: string
  emptyDesc?: string
}

// Shared message thread: used by the user widget and the admin conversation view.
// "Mine" bubbles belong to the viewer; the counterpart side gets the surface style.
export function SupportMessages({ messages, viewerId, emptyTitle, emptyDesc }: SupportMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  return (
    <div
      ref={scrollRef}
      role="log"
      aria-live="polite"
      aria-label={strings.supportChat.messagesLabel}
      className="flex-1 overflow-y-auto p-4 space-y-3 bg-paper/60"
    >
      {messages === null && (
        <div className="space-y-3" aria-hidden="true">
          <Skeleton className="h-10 w-3/5" />
          <Skeleton className="h-10 w-1/2 ms-auto" />
          <Skeleton className="h-10 w-2/3" />
        </div>
      )}

      {messages !== null && messages.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-center gap-2 px-4 select-none">
          <span className="text-3xl" aria-hidden="true">🐾</span>
          <p className="font-display font-bold text-lg text-ink">{emptyTitle}</p>
          {emptyDesc && <p className="text-sm text-ink-soft leading-relaxed">{emptyDesc}</p>}
        </div>
      )}

      {messages?.map((msg) => {
        const isMine = msg.sender_id === viewerId
        return (
          <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
            <div
              className={`max-w-[85%] px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words shadow-resting ${
                isMine
                  ? 'bg-pine text-white rounded-card rounded-ee-sm'
                  : 'bg-surface text-ink border border-border rounded-card rounded-ss-sm'
              }`}
            >
              {msg.body}
            </div>
            <span className="text-[11px] text-ink-soft mt-1 px-1 select-none" dir="ltr">
              {formatMessageTime(msg.created_at)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
