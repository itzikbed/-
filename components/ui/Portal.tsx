'use client'

import React from 'react'
import { createPortal } from 'react-dom'

/**
 * Renders its children at the end of <body>.
 *
 * A full-screen overlay must not be a descendant of anything that creates a
 * containing block for fixed positioning — `backdrop-filter`, `filter`,
 * `transform` and `will-change` all do. The sticky header carries a backdrop
 * blur, so a drawer rendered inside it had `inset-0` resolve against the
 * header's own 64px box: the panel collapsed to the height of its first row,
 * the scrim never covered the page, and the links spilled out over the content
 * with nothing behind them. Going through the body puts every overlay back on
 * the viewport, and keeps it there if some ancestor gains a filter later.
 *
 * Nothing renders on the server: an overlay only exists once someone opens it,
 * so there is no markup to lose.
 */
const subscribe = () => () => {}

export function Portal({ children }: { children: React.ReactNode }) {
  // False while rendering on the server and through hydration, true after —
  // so the client never renders a portal the server did not.
  const hydrated = React.useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )

  if (!hydrated) return null

  return createPortal(children, document.body)
}
