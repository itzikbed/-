import 'server-only'
import { after } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { deliverEmail, recordEmailLog, renderEmail } from './send'
import { renderOutboxTemplate, type OutboxPayload } from './templates'

// Delivery for messages that belong to a business transaction. The transaction
// writes an email_outbox row; nothing reaches the provider until it has
// committed, and a refused send is retried instead of ending as a log line.

async function resolveRecipientAddress(
  admin: ReturnType<typeof createAdminClient>,
  userId: string | null
): Promise<string> {
  if (!userId) throw new Error('outbox row has no recipient')
  const { data, error } = await admin.auth.admin.getUserById(userId)
  if (error || !data?.user?.email) throw new Error('recipient has no address')
  return data.user.email
}

export interface OutboxRunResult {
  claimed: number
  accepted: number
  failed: number
}

// Claims a batch, delivers it, records the outcome per row. Every step is
// per-row: one bad recipient cannot stop the rest of the batch.
export async function processEmailOutbox(limit = 10): Promise<OutboxRunResult> {
  const admin = createAdminClient()
  const result: OutboxRunResult = { claimed: 0, accepted: 0, failed: 0 }

  const { data: claimed, error } = await admin.rpc('claim_email_outbox', { p_limit: limit })
  if (error) {
    console.error('[OUTBOX] Failed to claim a batch:', error.message)
    return result
  }

  for (const row of claimed ?? []) {
    result.claimed += 1
    let failure: string | null = null
    let providerId: string | null = null

    try {
      const { subject, element } = renderOutboxTemplate(
        row.template,
        (row.payload ?? {}) as OutboxPayload
      )
      const to = await resolveRecipientAddress(admin, row.recipient_user_id)
      const { html, plainText } = await renderEmail(element)
      const delivery = await deliverEmail({ to, subject, html, text: plainText })
      failure = delivery.error
      providerId = delivery.id
    } catch (err) {
      failure = err instanceof Error ? err.message : String(err)
    }

    if (failure) result.failed += 1
    else result.accepted += 1

    const { error: settleError } = await admin.rpc('settle_email_outbox', {
      p_id: row.id,
      p_accepted: !failure,
      p_provider_message_id: providerId ?? undefined,
      p_error: failure ?? undefined
    })
    if (settleError) {
      // The row stays 'sending' and is reclaimed after the stale window, so the
      // message is retried rather than silently dropped.
      console.error('[OUTBOX] Failed to settle row', row.id, settleError.message)
    }

    await recordEmailLog(
      {
        template: row.template,
        recipientUserId: row.recipient_user_id,
        catId: row.cat_id,
        requestId: row.request_id,
        conversationId: row.conversation_id
      },
      failure ? 'failed' : 'accepted',
      failure
    )
  }

  return result
}

// Called at the end of an action that queued mail. The drain runs after the
// response, and a crash here costs a delay, not a message: whatever stays
// queued is picked up by the next drain.
export function drainEmailOutbox(limit = 10) {
  const run = async () => {
    try {
      await processEmailOutbox(limit)
    } catch (err) {
      console.error('[OUTBOX] Drain failed:', err instanceof Error ? err.message : String(err))
    }
  }

  try {
    after(run)
  } catch {
    return run()
  }
}
