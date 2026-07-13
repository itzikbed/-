'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

type RouterPush = (url: string) => void

let globalResolve: (() => void) | null = null

interface HasViewTransition {
  startViewTransition: (callback: () => void | Promise<void>) => {
    finished: Promise<void>
  }
}

/**
 * Triggers a client-side View Transition for navigation, returning a promise
 * that resolves only after Next.js has completed rendering the new route.
 */
export function triggerViewTransition(router: { push: RouterPush }, url: string): Promise<void> {
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  
  if (!prefersReducedMotion && typeof document !== 'undefined' && 'startViewTransition' in document) {
    const doc = document as unknown as HasViewTransition
    return new Promise<void>((resolve) => {
      doc.startViewTransition(() => {
        router.push(url)
        return new Promise<void>((innerResolve) => {
          globalResolve = () => {
            innerResolve()
            resolve()
          }
          // Safety timeout of 1.5 seconds if routing hangs or fails
          setTimeout(() => {
            if (globalResolve) {
              globalResolve()
              globalResolve = null
            }
          }, 1500)
        })
      })
    })
  } else {
    router.push(url)
    return Promise.resolve()
  }
}

/**
 * Component rendered at the root layout that detects pathname changes
 * and resolves the pending startViewTransition navigation promise.
 */
export function RouteTransitionTrigger() {
  const pathname = usePathname()

  useEffect(() => {
    if (globalResolve) {
      // Defer slightly using requestAnimationFrame to ensure the new route DOM has painted
      requestAnimationFrame(() => {
        if (globalResolve) {
          globalResolve()
          globalResolve = null
        }
      })
    }
  }, [pathname])

  return null
}
