'use client'

import React, { useRef, useEffect } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { strings } from '@/lib/strings'

interface UserType {
  id: string
  email?: string
}

interface ProfileType {
  full_name: string | null
  role: string
}

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
  user: UserType | null
  profile: ProfileType | null
}

export function MobileDrawer({ isOpen, onClose, user, profile }: MobileDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement
      document.body.style.overflow = 'hidden'
      // Focus close button on open
      setTimeout(() => {
        const closeBtn = drawerRef.current?.querySelector('[aria-label]') as HTMLElement
        closeBtn?.focus()
      }, 50)
    } else {
      document.body.style.overflow = ''
      if (previousActiveElement.current) {
        previousActiveElement.current.focus()
      }
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle ESC and Focus trap inside drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'Escape') {
        onClose()
        return
      }

      if (e.key === 'Tab') {
        if (!drawerRef.current) return
        const focusable = drawerRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([-1])'
        )
        if (focusable.length === 0) {
          e.preventDefault()
          return
        }

        const first = focusable[0] as HTMLElement
        const last = focusable[focusable.length - 1] as HTMLElement

        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus()
            e.preventDefault()
          }
        } else {
          if (document.activeElement === last) {
            first.focus()
            e.preventDefault()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden bg-ink/40 backdrop-blur-xs flex justify-end">
      {/* Backdrop Click Outside */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Drawer Content */}
      <div
        ref={drawerRef}
        tabIndex={-1}
        className="relative w-72 max-w-full bg-surface h-full shadow-hover border-s border-border flex flex-col justify-between p-6 animate-fade-slide-rtl focus-visible:outline-none"
      >
        <div className="space-y-6">
          {/* Header inside drawer */}
          <div className="flex justify-between items-center">
            <span className="font-display font-extrabold text-xl text-pine">{strings.common.siteName}</span>
            <button
              type="button"
              onClick={onClose}
              aria-label={strings.common.closeMenu}
              className="p-1.5 text-ink-soft hover:text-pine hover:bg-ink-light/10 rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation Links inside drawer */}
          <nav className="flex flex-col gap-4 text-lg font-semibold text-start">
            <Link
              href="/cats"
              onClick={onClose}
              className="px-3 py-2 text-ink-soft hover:text-pine hover:bg-ink-light/10 rounded-btn transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine"
            >
              {strings.nav.catalog}
            </Link>
            <Link
              href="/publish"
              onClick={onClose}
              className="px-3 py-2 text-ink-soft hover:text-pine hover:bg-ink-light/10 rounded-btn transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine"
            >
              {strings.nav.publish}
            </Link>
            {user && (
              <Link
                href="/requests"
                onClick={onClose}
                className="px-3 py-2 text-ink-soft hover:text-pine hover:bg-ink-light/10 rounded-btn transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine"
              >
                {strings.nav.requests}
              </Link>
            )}
            {profile?.role === 'admin' && (
              <Link
                href="/admin"
                onClick={onClose}
                className="px-3 py-2 text-pine font-bold hover:bg-ink-light/10 rounded-btn transition-all border-t border-border mt-2 pt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine"
              >
                {strings.nav.admin}
              </Link>
            )}
          </nav>
        </div>

        {/* Auth Slot inside drawer */}
        <div className="border-t border-border pt-6 text-start">
          {user ? (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-ink-soft leading-relaxed px-3">
                {strings.nav.greeting} <br />
                <Link href="/account" onClick={onClose} className="text-ink font-bold text-base hover:text-pine hover:underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine">
                  <bdi>{profile?.full_name || user.email}</bdi>
                </Link>
              </div>
              <form action="/api/auth/signout" method="POST" className="w-full">
                <button
                  type="submit"
                  className="w-full text-center bg-ink-light/10 hover:bg-ink-light/20 text-ink font-bold py-2.5 rounded-btn cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine"
                >
                  {strings.common.logout}
                </button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Link
                href="/login"
                onClick={onClose}
                className="w-full text-center text-pine hover:underline font-semibold py-2.5 rounded-btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine"
              >
                {strings.nav.login}
              </Link>
              <Link
                href="/signup"
                onClick={onClose}
                className="w-full text-center bg-marmalade text-ink hover:bg-marmalade-dp font-bold py-2.5 rounded-btn shadow-resting transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine"
              >
                {strings.nav.signup}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
