import type { Metadata } from "next"
import { Rubik, Assistant } from "next/font/google"
import "./globals.css"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { strings } from "@/lib/strings"
import { initHebrewValidation } from "@/lib/schemas/he-errors"

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
  title: "בית לחתול — אימוץ חתולים בישראל",
  description: "לכל חתול מגיע בית. פלטפורמה מפוקחת לאימוץ ומסירת חתולים בישראל.",
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
        {/* Header App Shell */}
        <header className="bg-surface border-b border-border shadow-resting sticky top-0 z-40 select-none">
          <div className="app-container h-16 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 focus-visible:outline-none">
              <span className="font-display font-extrabold text-2xl text-pine tracking-tight">
                {strings.common.siteName}
              </span>
            </Link>

            {/* Navigation links */}
            <nav className="hidden md:flex items-center gap-6 font-semibold">
              <Link href="/cats" className="text-ink-soft hover:text-pine transition-colors">
                {strings.nav.catalog}
              </Link>
              <Link href="/publish" className="text-ink-soft hover:text-pine transition-colors">
                {strings.nav.publish}
              </Link>
              {user && (
                <Link href="/requests" className="text-ink-soft hover:text-pine transition-colors">
                  {strings.nav.requests}
                </Link>
              )}
              {profile?.role === 'admin' && (
                <Link href="/admin" className="text-ink hover:text-pine transition-colors font-bold text-pine border-s border-border ps-6">
                  {strings.nav.admin}
                </Link>
              )}
            </nav>

            {/* Auth Slot */}
            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-ink-soft hidden sm:inline">
                    שלום, <bdi>{profile?.full_name || user.email}</bdi>
                  </span>
                  
                  {/* Logout Button */}
                  <form action="/api/auth/signout" method="POST">
                    <button
                      type="submit"
                      className="text-pine hover:underline text-sm font-semibold cursor-pointer focus-visible:outline-none"
                    >
                      {strings.common.logout}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    href="/login"
                    className="text-pine hover:underline text-sm font-semibold px-3 py-2"
                  >
                    {strings.nav.login}
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-marmalade text-ink hover:bg-marmalade-dp text-sm font-bold px-4 py-2 rounded-btn shadow-resting transition-all active:scale-98"
                  >
                    {strings.nav.signup}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-grow flex flex-col">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-surface border-t border-border py-8 mt-auto select-none">
          <div className="app-container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-ink-soft font-sans">
            <div>
              &copy; {new Date().getFullYear()} {strings.common.siteName}. כל הזכויות שמורות.
            </div>
            
            {/* Regulatory Compliance Links */}
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="hover:text-pine hover:underline">
                מדיניות פרטיות
              </Link>
              <span className="text-border">|</span>
              <Link href="/accessibility" className="hover:text-pine hover:underline">
                הצהרת נגישות
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
