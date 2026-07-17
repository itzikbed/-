import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables } from '@/lib/supabase/database.types'

export type SupportMessage = Tables<'support_messages'>
export type SupportConversation = Tables<'support_conversations'>

export interface AdminSupportConversation extends SupportConversation {
  user: { full_name: string | null } | null
  last_message: Pick<SupportMessage, 'body' | 'sender_id' | 'created_at'>[]
}

type Client = SupabaseClient<Database>

// Newest conversations first; each row embeds the sender profile and its latest
// message for the queue preview. Works with both the server and browser clients.
export async function fetchAdminConversations(supabase: Client): Promise<AdminSupportConversation[]> {
  const { data, error } = await supabase
    .from('support_conversations')
    .select('*, user:profiles(full_name), last_message:support_messages(body, sender_id, created_at)')
    .order('last_message_at', { ascending: false })
    .order('created_at', { referencedTable: 'last_message', ascending: false })
    .limit(1, { referencedTable: 'last_message' })
    .limit(100)

  if (error) throw error
  return data
}

// Messages the admin team has not read yet, grouped per conversation.
// Admin-sent messages are stamped read_by_admin_at on insert, so a null value
// always means "unread message from the user".
export async function fetchAdminUnreadMap(supabase: Client): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('support_messages')
    .select('conversation_id')
    .is('read_by_admin_at', null)

  if (error) throw error
  const map: Record<string, number> = {}
  for (const row of data) {
    map[row.conversation_id] = (map[row.conversation_id] || 0) + 1
  }
  return map
}

export async function fetchConversationMessages(supabase: Client, conversationId: string): Promise<SupportMessage[]> {
  const { data, error } = await supabase
    .from('support_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(500)

  if (error) throw error
  return data
}

export async function markConversationReadByUser(supabase: Client, conversationId: string): Promise<void> {
  await supabase
    .from('support_messages')
    .update({ read_by_user_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .is('read_by_user_at', null)
}

export async function markConversationReadByAdmin(supabase: Client, conversationId: string): Promise<void> {
  await supabase
    .from('support_messages')
    .update({ read_by_admin_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .is('read_by_admin_at', null)
}

const timeFormat = new Intl.DateTimeFormat('he-IL', { hour: '2-digit', minute: '2-digit' })
const dateTimeFormat = new Intl.DateTimeFormat('he-IL', {
  day: 'numeric',
  month: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})

export function formatMessageTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  return sameDay ? timeFormat.format(date) : dateTimeFormat.format(date)
}
