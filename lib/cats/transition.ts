import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { drainEmailOutbox } from '@/lib/emails/outbox'
import { gendered, strings } from '@/lib/strings'
import { isUuid } from '@/lib/security/media'

// Every meaningful cat status change goes through transition_cat_status
// (migration 0018). The database performs the status change, the sibling
// closure, the moderation record and the queued mail in one transaction, so a
// failure half-way cannot leave adopters rejected on a cat that is still live.

export type TransitionTarget = 'published' | 'rejected' | 'adopted' | 'archived'

export interface TransitionOutcome {
  ok: boolean
  formError?: string
  closedRequests?: number
}

function messageFor(reason: string | undefined): string {
  switch (reason) {
    case 'unauthenticated':
      return 'אנא התחבר תחילה.'
    case 'forbidden':
      return 'אין לך הרשאה לעדכן מודעה זו.'
    case 'not_found':
      return 'החתול לא נמצא.'
    case 'conflict':
      return strings.admin.conflictError
    case 'reason_required':
      return strings.admin.dialog.rejectReasonMin
    default:
      return strings.common.errorOccurred
  }
}

export async function transitionCat(
  catId: string,
  toStatus: TransitionTarget,
  reason?: string | null
): Promise<TransitionOutcome> {
  if (!isUuid(catId)) return { ok: false, formError: strings.common.errorOccurred }

  const supabase = await createClient()

  // The wording an adopter sees when the cat they asked about leaves
  // circulation. Hebrew copy stays in the application; the database stores only
  // what it is handed.
  let siblingNote: string | null = null
  if (toStatus === 'adopted' || toStatus === 'archived') {
    const { data: cat } = await supabase
      .from('cats')
      .select('name, sex')
      .eq('id', catId)
      .maybeSingle()
    if (cat) {
      siblingNote = gendered('emails', 'catAdoptedSiblingNote', cat.sex).replace('{name}', cat.name)
    }
  }

  const { data, error } = await supabase.rpc('transition_cat_status', {
    p_cat_id: catId,
    p_to_status: toStatus,
    p_reason: reason ?? undefined,
    p_sibling_note: siblingNote ?? undefined
  })

  if (error) {
    console.error('[CAT TRANSITION] rpc failed:', error.message)
    return { ok: false, formError: strings.admin.conflictError }
  }

  const result = (data ?? {}) as { ok?: boolean; reason?: string; closed_requests?: number }
  if (!result.ok) return { ok: false, formError: messageFor(result.reason) }

  // The transaction has committed. Everything it queued can now be delivered.
  drainEmailOutbox()

  return { ok: true, closedRequests: result.closed_requests ?? 0 }
}
