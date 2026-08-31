import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { render } from '@react-email/components'
import {
  OUTBOX_TEMPLATE_NAMES,
  asSex,
  isKnownOutboxTemplate,
  renderOutboxTemplate
} from './templates'

const MIGRATION_PATH = 'supabase/migrations/0018_atomic_transitions_outbox.sql'
const migration = fs.readFileSync(path.join(process.cwd(), MIGRATION_PATH), 'utf8')

// The database decides which messages a transition queues; this module decides
// how to render them. A name that exists on one side only would not fail at
// deploy time — it would fail five retries later, as an abandoned row nobody is
// watching. So the two sides are compared here instead.
function templatesQueuedBySql(): string[] {
  const names = new Set<string>()
  // the owner-notification case arms: `when ... then 'cat_approved'`
  for (const match of migration.matchAll(/then '([a-z_]+)'/g)) names.add(match[1])
  // the sibling-closure insert: a literal template followed by its payload
  for (const match of migration.matchAll(/'([a-z_]+)',\s*\n\s*jsonb_build_object/g)) {
    names.add(match[1])
  }
  return [...names]
}

describe('outbox template registry', () => {
  it('can render every template the transition queues', () => {
    const queued = templatesQueuedBySql()
    expect(queued.length).toBeGreaterThan(0)
    for (const name of queued) {
      expect(isKnownOutboxTemplate(name), `${name} is queued by ${MIGRATION_PATH} but has no renderer`).toBe(true)
    }
  })

  it('does not carry a renderer the database never queues', () => {
    const queued = new Set(templatesQueuedBySql())
    for (const name of OUTBOX_TEMPLATE_NAMES) {
      expect(queued.has(name), `${name} has a renderer but nothing queues it`).toBe(true)
    }
  })

  it('refuses an unknown template rather than sending an empty message', () => {
    expect(() => renderOutboxTemplate('not_a_template', {})).toThrow(/unknown outbox template/)
    expect(isKnownOutboxTemplate('not_a_template')).toBe(false)
  })

  it('renders a subject and a body carrying the cat name', async () => {
    for (const name of OUTBOX_TEMPLATE_NAMES) {
      const { subject, element } = renderOutboxTemplate(name, {
        catName: 'מיצי',
        catSex: 'female',
        catId: '11111111-1111-4111-8111-111111111111',
        reason: 'סיבה לבדיקה'
      })
      expect(subject.trim().length, `${name} produced an empty subject`).toBeGreaterThan(0)

      const html = await render(element)
      expect(html, `${name} did not render the cat name`).toContain('מיצי')

      const text = await render(element, { plainText: true })
      expect(text.trim().length, `${name} produced an empty plain-text part`).toBeGreaterThan(0)
    }
  })

  it('survives a payload that lost its fields', async () => {
    // A row queued by an older revision, or a cat deleted before the drain ran.
    for (const name of OUTBOX_TEMPLATE_NAMES) {
      const { subject, element } = renderOutboxTemplate(name, {})
      expect(subject.trim().length, `${name} produced an empty subject`).toBeGreaterThan(0)
      const html = await render(element)
      expect(html.length).toBeGreaterThan(0)
    }
  })

  it('reads an unexpected sex as unknown instead of guessing', () => {
    expect(asSex('female')).toBe('female')
    expect(asSex('male')).toBe('male')
    expect(asSex(undefined)).toBe('unknown')
    expect(asSex('other')).toBe('unknown')
  })
})
