import React from 'react'
import CatApproved, { getSubject as catApprovedSubject } from '@/emails/CatApproved'
import CatRejected, { getSubject as catRejectedSubject } from '@/emails/CatRejected'
import CatArchivedByAdmin, { getSubject as catArchivedSubject } from '@/emails/CatArchivedByAdmin'
import RequestClosedCatAdopted, { getSubject as requestClosedSubject } from '@/emails/RequestClosedCatAdopted'

// The set of messages a database transaction may queue, and how to turn a
// queued payload back into a subject and a template. Kept free of server-only
// imports so the mapping itself can be tested directly: a payload that no
// longer matches its template would otherwise only surface as a failed send.

export type Sex = 'male' | 'female' | 'unknown'

export interface OutboxPayload {
  catName?: string
  catSex?: string
  catId?: string
  reason?: string | null
}

export const asSex = (value: string | undefined): Sex =>
  value === 'male' || value === 'female' ? value : 'unknown'

const TEMPLATES: Record<string, (payload: OutboxPayload) => { subject: string; element: React.ReactElement }> = {
  cat_approved: (p) => ({
    subject: catApprovedSubject(p.catName ?? '', asSex(p.catSex)),
    element: React.createElement(CatApproved, {
      catName: p.catName ?? '', catSex: asSex(p.catSex), catId: p.catId ?? ''
    })
  }),
  cat_rejected: (p) => ({
    subject: catRejectedSubject(p.catName ?? '', asSex(p.catSex)),
    element: React.createElement(CatRejected, {
      catName: p.catName ?? '', catSex: asSex(p.catSex), reason: p.reason ?? ''
    })
  }),
  cat_archived_by_admin: (p) => ({
    subject: catArchivedSubject(p.catName ?? '', asSex(p.catSex)),
    element: React.createElement(CatArchivedByAdmin, {
      catName: p.catName ?? '', catSex: asSex(p.catSex), reason: p.reason ?? ''
    })
  }),
  request_closed_cat_adopted: (p) => ({
    subject: requestClosedSubject(p.catName ?? '', asSex(p.catSex)),
    element: React.createElement(RequestClosedCatAdopted, {
      catName: p.catName ?? '', catSex: asSex(p.catSex)
    })
  })
}

export const OUTBOX_TEMPLATE_NAMES = Object.keys(TEMPLATES)

export function isKnownOutboxTemplate(template: string): boolean {
  return Object.prototype.hasOwnProperty.call(TEMPLATES, template)
}

export function renderOutboxTemplate(template: string, payload: OutboxPayload) {
  if (!isKnownOutboxTemplate(template)) {
    throw new Error(`unknown outbox template: ${template}`)
  }
  return TEMPLATES[template](payload)
}
