'use client'

import React, { useCallback, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { strings } from '@/lib/strings'
import { useSupportChat } from './useSupportChat'
import { SupportChatPanel } from './SupportChatPanel'
import { SupportGuestCard } from './SupportGuestCard'

interface SupportChatLauncherProps {
  userId: string | null
}

// Floating chat entry point, pinned to the start corner (right side in RTL),
// above the footer. Guests get a small sign-in card instead of the chat panel.
export function SupportChatLauncher({ userId }: SupportChatLauncherProps) {
  const [open, setOpen] = useState(false)
  const chat = useSupportChat(userId, open)
  const close = useCallback(() => setOpen(false), [])

  const label =
    chat.unreadCount > 0
      ? strings.supportChat.launcherUnreadLabel.replace('{count}', String(chat.unreadCount))
      : strings.supportChat.launcherLabel

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="fixed bottom-5 start-5 z-40 w-14 h-14 rounded-full bg-pine text-white shadow-hover flex items-center justify-center cursor-pointer transition-all hover:bg-pine/90 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2"
      >
        <MessageCircle className="w-6 h-6" aria-hidden="true" />
        {chat.unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-1 -end-1 min-w-5 h-5 px-1 rounded-full bg-marmalade text-ink text-xs font-bold flex items-center justify-center border-2 border-surface"
          >
            {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
          </span>
        )}
      </button>

      {open &&
        (userId ? (
          <SupportChatPanel chat={chat} userId={userId} onClose={close} />
        ) : (
          <SupportGuestCard onClose={close} />
        ))}
    </>
  )
}
