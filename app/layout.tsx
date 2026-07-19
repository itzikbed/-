import type { Metadata } from "next"
import { Rubik, Assistant } from "next/font/google"
import "./globals.css"
import { createClient } from "@/lib/supabase/server"
import { strings } from "@/lib/strings"
import { Header } from "@/components/nav/Header"
import { Footer } from "@/components/nav/Footer"
import { SupportChatLauncher } from "@/components/support/SupportChatLauncher"
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://homeforcats.org'),
  title: strings.common.metaTitle,
  description: strings.common.metaDesc,
  alternates: {
    canonical: './'
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
      <body className="min-h-screen flex flex-col bg-paper paper-grain text-ink font-sans">
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

        {/* Support chat: users + guests; admins answer from the dashboard */}
        {profile?.role !== 'admin' && <SupportChatLauncher userId={user?.id ?? null} />}

        <Footer />
      </body>
    </html>
  )
}
