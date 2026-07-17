'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { strings } from '@/lib/strings'
import { SupportMessages } from '@/components/support/SupportMessages'
import { SupportComposer } from '@/components/support/SupportComposer'
import { sendSupportReplyAction, closeSupportConversationAction } from './support-actions'
import {
  fetchConversationMessages,
  markConversationReadByAdmin,
  SupportMessage,
  AdminSupportConversation
} from '@/lib/support/chat'

interface SupportConversationViewProps {
  conversation: AdminSupportConversation
  adminId: string
  onBack: () => void
  onRead: (conversationId: string) => void
  onClosed: (conversationId: string) => void
}

export default function SupportConversationView({
  conversation,
  adminId,
  onBack,
  onRead,
  onClosed
}: SupportConversationViewProps) {
  const [supabase] = useState(() => createClient())

  const [messages, setMessages] = useState<SupportMessage[] | null>(null)
  const [sending, setSending] = useState(false)
  const [closing, setClosing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const markRead = useCallback(async () => {
    await markConversationReadByAdmin(supabase, conversation.id)
    onRead(conversation.id)
  }, [supabase, conversation.id, onRead])

  const loadMessages = useCallback(async () => {
    try {
      const msgs = await fetchConversationMessages(supabase, conversation.id)
      setMessages(msgs)
      await markRead()
    } catch {
      setError(strings.supportChat.loadError)
    }
  }, [supabase, conversation.id, markRead])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (cancelled) return
      await loadMessages()
    }
    load().catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [loadMessages])

  // Live incoming messages for the open thread, with a 15s polling fallback.
  useEffect(() => {
    const channel = supabase
      .channel(`admin-support-${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        (payload) => {
          const msg = payload.new as SupportMessage
          setMessages((prev) => {
            if (!prev || prev.some((m) => m.id === msg.id)) return prev
            return [...prev, msg]
          })
          if (msg.sender_id !== adminId) void markRead()
        }
      )
      .subscribe()

    // Poll unconditionally: an open thread must not miss messages even when the
    // channel claims SUBSCRIBED but silently drops events.
    const interval = setInterval(() => {
      void loadMessages()
    }, 15000)

    return () => {
      clearInterval(interval)
      void supabase.removeChannel(channel)
    }
  }, [supabase, conversation.id, adminId, markRead, loadMessages])

  const handleSend = useCallback(
    async (body: string): Promise<boolean> => {
      setSending(true)
      setError(null)
      try {
        const res = await sendSupportReplyAction(conversation.id, body)
        if (!res.ok || !res.data) {
          setError(!res.ok ? res.formError || strings.supportChat.sendError : strings.supportChat.sendError)
          return false
        }
        const message = res.data
        setMessages((prev) => {
          const base = prev ?? []
          return base.some((m) => m.id === message.id) ? base : [...base, message]
        })
        return true
      } finally {
        setSending(false)
      }
    },
    [conversation.id]
  )

  const handleClose = useCallback(async () => {
    setClosing(true)
    setError(null)
    const res = await closeSupportConversationAction(conversation.id)
    setClosing(false)
    if (res.ok) onClosed(conversation.id)
    else setError(res.formError || strings.supportChat.adminCloseError)
  }, [conversation.id, onClosed])

  const userName = conversation.user?.full_name || strings.supportChat.userFallbackName

  return (
    <div className="bg-surface border border-border rounded-card shadow-resting flex flex-col h-[36rem] overflow-hidden">
      {/* Thread header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-paper/40">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onBack}
            aria-label={strings.supportChat.adminBackToList}
            className="p-1.5 text-ink-soft hover:text-pine rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine"
          >
            <ArrowLeft className="w-5 h-5 rtl:-scale-x-100" aria-hidden="true" />
          </button>
          <span className="font-display font-bold text-ink truncate">
            {strings.supportChat.adminConversationWith.replace('{name}', userName)}
          </span>
          <span
            className={`shrink-0 px-2 py-0.5 text-xs font-bold rounded-full ${
              conversation.status === 'open' ? 'bg-pine-soft text-pine' : 'bg-border text-ink-soft'
            }`}
          >
            {conversation.status === 'open'
              ? strings.supportChat.adminStatusOpen
              : strings.supportChat.adminStatusClosed}
          </span>
        </div>
        {conversation.status === 'open' && (
          <button
            type="button"
            onClick={() => void handleClose()}
            disabled={closing}
            className="shrink-0 px-4 py-1.5 text-sm font-bold text-danger border border-danger/40 rounded-btn hover:bg-danger/5 cursor-pointer transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine"
          >
            {closing ? strings.common.loading : strings.supportChat.adminCloseBtn}
          </button>
        )}
      </div>

      {conversation.status === 'closed' && (
        <p className="px-4 py-2 text-xs text-ink-soft bg-marmalade-sf border-b border-border text-start">
          {strings.supportChat.adminClosedNotice}
        </p>
      )}

      <SupportMessages
        messages={messages}
        viewerId={adminId}
        emptyTitle={strings.supportChat.adminNoMessages}
      />

      {error && (
        <p role="alert" className="px-4 py-2 text-xs font-semibold text-danger bg-danger/5 border-t border-border text-start">
          {error}
        </p>
      )}

      <SupportComposer
        onSend={handleSend}
        sending={sending}
        placeholder={strings.supportChat.adminReplyPlaceholder}
      />
    </div>
  )
}
