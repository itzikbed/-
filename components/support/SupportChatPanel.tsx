'use client'

import React, { useRef } from 'react'
import { X } from 'lucide-react'
import { strings } from '@/lib/strings'
import { SupportMessages } from './SupportMessages'
import { SupportComposer } from './SupportComposer'
import { useDialogFocus } from './useDialogFocus'
import type { SupportChatState } from './useSupportChat'

interface SupportChatPanelProps {
  chat: SupportChatState
  userId: string
  onClose: () => void
}

export function SupportChatPanel({ chat, userId, onClose }: SupportChatPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  useDialogFocus(true, onClose, panelRef, 'textarea')

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={strings.supportChat.panelTitle}
      className="fixed bottom-24 start-4 z-50 w-[min(24rem,calc(100vw-2rem))] h-[min(70vh,34rem)] bg-surface rounded-card shadow-hover border border-border flex flex-col overflow-hidden animate-fade-rise"
    >
      {/* Header */}
      <div className="bg-pine text-white px-4 py-3 flex items-center justify-between gap-3 select-none">
        <div className="flex flex-col text-start">
          <span className="font-display font-bold text-base">{strings.supportChat.panelTitle}</span>
          <span className="text-xs text-white/80">{strings.supportChat.panelSubtitle}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={strings.supportChat.closeChat}
          className="p-1.5 rounded-full hover:bg-white/15 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      <SupportMessages
        messages={chat.messages}
        viewerId={userId}
        emptyTitle={strings.supportChat.emptyTitle}
        emptyDesc={strings.supportChat.emptyDesc}
      />

      {chat.conversationStatus === 'closed' && (
        <p className="px-4 py-2 text-xs text-ink-soft bg-marmalade-sf border-t border-border text-start">
          {strings.supportChat.closedNotice}
        </p>
      )}
      {chat.error && (
        <p role="alert" className="px-4 py-2 text-xs font-semibold text-danger bg-danger/5 border-t border-border text-start">
          {chat.error}
        </p>
      )}

      <SupportComposer
        onSend={chat.send}
        sending={chat.sending}
        placeholder={strings.supportChat.inputPlaceholder}
      />
    </div>
  )
}
