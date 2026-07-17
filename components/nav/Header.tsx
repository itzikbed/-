'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { strings } from '@/lib/strings'
import { MobileDrawer } from './MobileDrawer'

interface UserType {
  id: string
  email?: string
}

interface ProfileType {
  full_name: string | null
  role: string
}

interface HeaderProps {
  user: UserType | null
  profile: ProfileType | null
}

export function Header({ user, profile }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const [prevPathname, setPrevPathname] = useState(pathname)

  if (pathname !== prevPathname) {
    setPrevPathname(pathname)
    setIsOpen(false)
  }

  return (
    <header className="bg-surface border-b border-border shadow-resting sticky top-0 z-40 select-none">
      <div className="app-container h-16 flex items-center justify-between">
        {/* Logo */}
        <Link 
          href="/" 
          className="flex items-center gap-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2"
          aria-label={`${strings.common.siteName} — ${strings.nav.home}`}
        >
          <span className="font-display font-extrabold text-2xl text-pine tracking-tight flex items-center select-none" aria-hidden="true">
            <span>{strings.common.siteName.slice(0, 5)}</span>
            <span className="inline-flex items-center mx-[0.02em] relative top-[0.03em]">
              🐾
            </span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-base font-semibold">
          <Link 
            href="/cats" 
            className={`text-ink-soft hover:text-pine transition-colors py-1.5 border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine rounded-xs ${
              pathname === '/cats' ? 'border-pine text-pine font-bold' : 'border-transparent'
            }`}
          >
            {strings.nav.catalog}
          </Link>
          <Link 
            href="/publish" 
            className={`text-ink-soft hover:text-pine transition-colors py-1.5 border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine rounded-xs ${
              pathname.startsWith('/publish') ? 'border-pine text-pine font-bold' : 'border-transparent'
            }`}
          >
            {strings.nav.publish}
          </Link>
          <Link
            href="/about"
            className={`text-ink-soft hover:text-pine transition-colors py-1.5 border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine rounded-xs ${
              pathname === '/about' ? 'border-pine text-pine font-bold' : 'border-transparent'
            }`}
          >
            {strings.nav.about}
          </Link>
          {user && (
            <Link 
              href="/requests" 
              className={`text-ink-soft hover:text-pine transition-colors py-1.5 border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine rounded-xs ${
                pathname === '/requests' ? 'border-pine text-pine font-bold' : 'border-transparent'
              }`}
            >
              {strings.nav.requests}
            </Link>
          )}
          {profile?.role === 'admin' && (
            <Link 
              href="/admin" 
              className={`text-pine hover:text-pine-hover font-bold py-1 px-3 border border-pine/30 rounded-full hover:bg-pine-soft transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine ${
                pathname.startsWith('/admin') ? 'bg-pine-soft border-pine' : ''
              }`}
            >
              {strings.nav.admin}
            </Link>
          )}
        </nav>

        {/* Right Section (Auth / Mobile Menu) */}
        <div className="flex items-center gap-4">
          {/* Desktop Auth */}
          <div className="hidden md:block">
            {user ? (
              <div className="flex items-center gap-4 text-base font-semibold">
                <span className="text-ink-soft">
                  {strings.nav.greeting}{' '}
                  <Link href="/account" className="text-ink font-bold hover:text-pine hover:underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine">
                    <bdi>{profile?.full_name || user.email}</bdi>
                  </Link>
                </span>
                
                <form action="/api/auth/signout" method="POST" className="inline">
                  <button 
                    type="submit" 
                    className="text-sm font-bold text-ink-soft hover:text-danger bg-ink-light/5 hover:bg-ink-light/10 py-1.5 px-3.5 rounded-btn cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine"
                  >
                    {strings.common.logout}
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link 
                  href="/login" 
                  className="text-base text-pine hover:underline font-semibold px-3 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine rounded-sm"
                >
                  {strings.nav.login}
                </Link>
                <Link 
                  href="/signup" 
                  className="inline-flex items-center justify-center font-sans font-bold rounded-btn min-h-[40px] px-5 text-sm bg-marmalade text-ink hover:bg-marmalade-dp transition-colors shadow-resting active:scale-98"
                >
                  {strings.nav.signup}
                </Link>
              </div>
            )}
          </div>

          {/* Hamburger Menu Button */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-expanded={isOpen}
            aria-label={strings.common.openMenu}
            className="md:hidden p-2 text-ink-soft hover:text-pine hover:bg-ink-light/10 rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay Component */}
      <MobileDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        user={user}
        profile={profile}
      />
    </header>
  )
}
