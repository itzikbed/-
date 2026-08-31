'use client'

import React, { useEffect, useRef } from 'react'
import { Mascot } from '@/components/mascot/Mascot'
import { Skeleton } from '@/components/ui/Skeleton'
import { strings } from '@/lib/strings'
import { formatMessageTime, SupportMessage } from '@/lib/support/chat'

interface SupportMessagesProps {
  messages: SupportMessage[] | null
  /**
   * The user this conversation belongs to. Anyone else writing in it is the
   * team — the database only lets those two parties post here.
   */
  participantUserId: string
  /** How the participant is named to a screen reader in this view. */
  participantLabel: string
  emptyTitle: string
  emptyDesc?: string
}

// Shared message thread: used by the user widget and by the admin console.
// Sides and colours are decided by ROLE, not by who is looking. The team always
// sits on the start side in pine; the person who opened the conversation always
// sits on the end side on paper. A reply that changed sides depending on the
// viewer made the same conversation read as two different conversations.
export function SupportMessages({
  messages,
  participantUserId,
  participantLabel,
  emptyTitle,
  emptyDesc
}: SupportMessagesProps) {
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
          <span aria-hidden="true" className="mb-1">
            <Mascot pose="sitting" />
          </span>
          <p className="font-display font-bold text-lg text-ink">{emptyTitle}</p>
          {emptyDesc && <p className="text-sm text-ink-soft leading-relaxed">{emptyDesc}</p>}
        </div>
      )}

      {messages?.map((msg) => {
        const isAdminMessage = msg.sender_id !== participantUserId
        return (
          <div
            key={msg.id}
            className={`flex flex-col ${isAdminMessage ? 'items-start' : 'items-end'}`}
          >
            {isAdminMessage ? (
              <span className="text-[11px] font-bold text-pine mb-1 px-1 select-none">
                {strings.supportChat.adminSenderName}
              </span>
            ) : (
              <span className="sr-only">{participantLabel}</span>
            )}

            <div
              className={`max-w-[85%] px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words shadow-resting ${
                isAdminMessage
                  ? 'bg-pine text-white rounded-card rounded-ss-sm'
                  : 'bg-surface text-ink border border-border rounded-card rounded-ee-sm'
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
