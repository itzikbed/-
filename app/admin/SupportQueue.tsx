'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { strings } from '@/lib/strings'
import SupportConversationView from './SupportConversationView'
import {
  fetchAdminConversations,
  fetchAdminUnreadMap,
  formatMessageTime,
  AdminSupportConversation
} from '@/lib/support/chat'

interface SupportQueueProps {
  initialConversations: AdminSupportConversation[]
  initialUnreadMap: Record<string, number>
  adminId: string
  onUnreadTotalChange: (total: number) => void
}

export default function SupportQueue({
  initialConversations,
  initialUnreadMap,
  adminId,
  onUnreadTotalChange
}: SupportQueueProps) {
  const [supabase] = useState(() => createClient())

  const [conversations, setConversations] = useState(initialConversations)
  const [unreadMap, setUnreadMap] = useState(initialUnreadMap)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedRef = useRef<string | null>(null)

  useEffect(() => {
    selectedRef.current = selectedId
  }, [selectedId])

  useEffect(() => {
    onUnreadTotalChange(Object.values(unreadMap).reduce((sum, n) => sum + n, 0))
  }, [unreadMap, onUnreadTotalChange])

  const refetch = useCallback(async () => {
    try {
      const [convs, unread] = await Promise.all([
        fetchAdminConversations(supabase),
        fetchAdminUnreadMap(supabase)
      ])
      // The open thread marks itself read on arrival — don't flash its counter.
      if (selectedRef.current) unread[selectedRef.current] = 0
      setConversations(convs)
      setUnreadMap(unread)
    } catch {
      // keep the last known list; polling/realtime will retry
    }
  }, [supabase])

  // Fresh list on mount, live updates on any new message, 15s polling fallback.
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (cancelled) return
      await refetch()
    }
    load().catch(() => undefined)
    const channel = supabase
      .channel('admin-support-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_messages' },
        () => void refetch()
      )
      .subscribe()
    // Poll unconditionally as a fallback — a channel can report SUBSCRIBED yet
    // silently drop events (seen right after the publication change).
    const interval = setInterval(() => {
      void refetch()
    }, 15000)
    return () => {
      cancelled = true
      clearInterval(interval)
      void supabase.removeChannel(channel)
    }
  }, [supabase, refetch])

  const handleRead = useCallback((conversationId: string) => {
    setUnreadMap((prev) => (prev[conversationId] ? { ...prev, [conversationId]: 0 } : prev))
  }, [])

  const handleClosed = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, status: 'closed' } : c))
    )
  }, [])

  const selected = selectedId ? conversations.find((c) => c.id === selectedId) : undefined

  if (selected) {
    return (
      <SupportConversationView
        conversation={selected}
        adminId={adminId}
        onBack={() => setSelectedId(null)}
        onRead={handleRead}
        onClosed={handleClosed}
      />
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-card shadow-resting p-10 text-center text-ink-soft font-semibold">
        {strings.supportChat.adminListEmpty}
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {conversations.map((conv) => {
        const unread = unreadMap[conv.id] || 0
        const preview = conv.last_message[0]?.body || ''
        const userName = conv.user?.full_name || strings.supportChat.userFallbackName
        return (
          <li key={conv.id}>
            <button
              type="button"
              onClick={() => setSelectedId(conv.id)}
              className="w-full text-start bg-surface border border-border rounded-card shadow-resting hover:shadow-hover hover:border-pine/40 transition-all p-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-display font-bold text-ink truncate">{userName}</span>
                <span className="shrink-0 text-xs text-ink-soft select-none" dir="ltr">
                  {formatMessageTime(conv.last_message_at)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 mt-1.5">
                <span className="text-sm text-ink-soft truncate">{preview}</span>
                <span className="shrink-0 flex items-center gap-2">
                  {unread > 0 && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-marmalade text-ink">
                      {strings.supportChat.adminUnreadChip.replace('{count}', String(unread))}
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                      conv.status === 'open' ? 'bg-pine-soft text-pine' : 'bg-border text-ink-soft'
                    }`}
                  >
                    {conv.status === 'open'
                      ? strings.supportChat.adminStatusOpen
                      : strings.supportChat.adminStatusClosed}
                  </span>
                </span>
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
