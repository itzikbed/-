import type { Metadata } from "next"
import { Rubik, Assistant } from "next/font/google"
import "./globals.css"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { strings } from "@/lib/strings"
import { Header } from "@/components/nav/Header"
import { initHebrewValidation } from "@/lib/schemas/he-errors"
import { RouteTransitionTrigger } from "@/lib/utils/view-transition-navigation"

// Initialize Hebrew Error maps globally for validation
initHebrewValidation()

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["hebrew", "latin"],
  weight: ["700", "800"],
  display: "swap",
})

const assistant = Assistant({
  variable: "--font-assistant",
  subsets: ["hebrew", "latin"],
  weight: ["400", "600"],
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://cats-adoption.co.il'),
  title: strings.common.metaTitle,
  description: strings.common.metaDesc,
  alternates: {
    canonical: '/'
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <html
      lang="he"
      dir="rtl"
      className={`${rubik.variable} ${assistant.variable}`}
    >
      <body className="min-h-screen flex flex-col bg-paper text-ink font-sans">
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:start-4 focus:z-50 focus:bg-marmalade focus:text-ink focus:px-4 focus:py-2.5 focus:rounded-btn focus:font-bold focus:shadow-resting focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine"
        >
          {strings.common.skipToMain}
        </a>
        <RouteTransitionTrigger />
        <Header user={user} profile={profile} />

        {/* Main Content Area */}
        <main id="main-content" className="flex-grow flex flex-col">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-surface border-t border-border py-8 mt-auto select-none">
          <div className="app-container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-ink-soft font-sans">
            <div>
              &copy; {new Date().getFullYear()} {strings.common.siteName}. {strings.nav.allRightsReserved}
              {process.env.NEXT_PUBLIC_CONTACT_EMAIL && (
                <span className="ms-2 select-none">
                  | {strings.common.support}:{' '}
                  <a href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}`} className="text-pine font-bold hover:underline">
                    {process.env.NEXT_PUBLIC_CONTACT_EMAIL}
                  </a>
                </span>
              )}
            </div>
            
            {/* Regulatory Compliance Links */}
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="hover:text-pine hover:underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2">
                {strings.nav.privacyPolicy}
              </Link>
              <span className="text-border">|</span>
              <Link href="/accessibility" className="hover:text-pine hover:underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2">
                {strings.nav.accessibilityDeclaration}
              </Link>
              <span className="text-border">|</span>
              <Link href="/terms" className="hover:text-pine hover:underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2">
                {strings.nav.terms}
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
