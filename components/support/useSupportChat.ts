'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendSupportMessageAction } from '@/app/support/actions'
import {
  fetchConversationMessages,
  markConversationReadByUser,
  SupportMessage
} from '@/lib/support/chat'
import { strings } from '@/lib/strings'

export interface SupportChatState {
  messages: SupportMessage[] | null
  conversationStatus: 'open' | 'closed' | null
  unreadCount: number
  sending: boolean
  error: string | null
  send: (body: string) => Promise<boolean>
  clearError: () => void
}

// Client state for the user-side chat: conversation lookup, thread loading,
// realtime subscription with a 15s polling fallback, unread badge and sending.
export function useSupportChat(userId: string | null, isOpen: boolean): SupportChatState {
  const [supabase] = useState(() => createClient())

  const [conversationId, setConversationId] = useState<string | null>(null)
  const [conversationStatus, setConversationStatus] = useState<'open' | 'closed' | null>(null)
  const [messages, setMessages] = useState<SupportMessage[] | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isOpenRef = useRef(isOpen)
  const realtimeUp = useRef(false)
  const loadedConvRef = useRef<string | null>(null)

  useEffect(() => {
    isOpenRef.current = isOpen
  }, [isOpen])

  const markRead = useCallback(
    async (convId: string) => {
      await markConversationReadByUser(supabase, convId)
      setUnreadCount(0)
    },
    [supabase]
  )

  // Find the user's conversation and unread count once on mount.
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    const load = async () => {
      const { data: conv } = await supabase
        .from('support_conversations')
        .select('id, status')
        .eq('user_id', userId)
        .order('last_message_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (cancelled || !conv) return
      setConversationId(conv.id)
      setConversationStatus(conv.status === 'closed' ? 'closed' : 'open')
      const { count } = await supabase
        .from('support_messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .is('read_by_user_at', null)
      if (!cancelled && count) setUnreadCount(count)
    }
    load().catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [userId, supabase])

  const loadMessages = useCallback(
    async (convId: string) => {
      try {
        const msgs = await fetchConversationMessages(supabase, convId)
        setMessages(msgs)
        const { data: conv } = await supabase
          .from('support_conversations')
          .select('status')
          .eq('id', convId)
          .maybeSingle()
        if (conv) setConversationStatus(conv.status === 'closed' ? 'closed' : 'open')
        await markRead(convId)
      } catch {
        setError(strings.supportChat.loadError)
      }
    },
    [supabase, markRead]
  )

  // Load the thread when the panel opens. First load shows the skeleton
  // (messages === null); a reopen keeps the previous thread until refresh lands.
  useEffect(() => {
    if (!isOpen) {
      loadedConvRef.current = null
      return
    }
    if (!conversationId || loadedConvRef.current === conversationId) return
    loadedConvRef.current = conversationId
    void loadMessages(conversationId)
  }, [isOpen, conversationId, loadMessages])

  // Realtime subscription for incoming messages.
  useEffect(() => {
    if (!userId || !conversationId) return
    const channel = supabase
      .channel(`support-chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const msg = payload.new as SupportMessage
          setMessages((prev) => {
            if (!prev || prev.some((m) => m.id === msg.id)) return prev
            return [...prev, msg]
          })
          if (msg.sender_id !== userId) {
            setConversationStatus('open')
            if (isOpenRef.current) void markRead(conversationId)
            else setUnreadCount((c) => c + 1)
          }
        }
      )
      .subscribe((status) => {
        realtimeUp.current = status === 'SUBSCRIBED'
      })
    return () => {
      realtimeUp.current = false
      void supabase.removeChannel(channel)
    }
  }, [supabase, userId, conversationId, markRead])

  // Polling fallback: always while the panel is open (covers a channel that
  // reports SUBSCRIBED but silently drops events), plus badge refresh when the
  // realtime channel is down.
  useEffect(() => {
    if (!userId || !conversationId) return
    const interval = setInterval(() => {
      if (isOpenRef.current) {
        void loadMessages(conversationId)
      } else {
        if (realtimeUp.current) return
        void supabase
          .from('support_messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conversationId)
          .is('read_by_user_at', null)
          .then(({ count }) => setUnreadCount(count || 0))
      }
    }, 15000)
    return () => clearInterval(interval)
  }, [supabase, userId, conversationId, loadMessages])

  const send = useCallback(
    async (body: string): Promise<boolean> => {
      if (sending) return false
      setSending(true)
      setError(null)
      try {
        const res = await sendSupportMessageAction(body)
        if (!res.ok) {
          setError(res.formError || strings.supportChat.sendError)
          return false
        }
        const { conversationId: convId, message } = res.data
        loadedConvRef.current = convId
        setConversationId(convId)
        setConversationStatus('open')
        setMessages((prev) => {
          const base = prev ?? []
          return base.some((m) => m.id === message.id) ? base : [...base, message]
        })
        return true
      } catch {
        setError(strings.supportChat.sendError)
        return false
      } finally {
        setSending(false)
      }
    },
    [sending]
  )

  const clearError = useCallback(() => setError(null), [])

  return {
    // No conversation yet = an empty thread (shows the "how can we help" state)
    messages: conversationId ? messages : [],
    conversationStatus,
    unreadCount,
    sending,
    error,
    send,
    clearError
  }
}
