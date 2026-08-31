import type { Metadata } from "next"
import { Rubik, Assistant } from "next/font/google"
import "./globals.css"
import { createClient } from "@/lib/supabase/server"
import { strings } from "@/lib/strings"
import { Header } from "@/components/nav/Header"
import { Footer } from "@/components/nav/Footer"
import { SupportChatLauncher } from "@/components/support/SupportChatLauncher"
import { GroundCanvas } from "@/components/ui/GroundCanvas"
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
      <body className="min-h-screen flex flex-col bg-paper ground-aurora has-motes text-ink font-sans">
        {/* The sweep that divides a cat card's photo from its details. It is
            deliberately not an arc: the two shoulders sit at different heights
            and the crest is off centre, so the edge reads as drawn rather than
            as a circle segment. Object-bounding-box units let one definition
            serve every card size. */}
        <svg aria-hidden="true" focusable="false" width="0" height="0" className="absolute">
          <defs>
            {/* The sweep is cut out of the PHOTO, not painted on top of it.
                A painted shape has to be filled with some colour, and any
                colour is wrong the moment the page ground stops being flat —
                which is exactly what left a pale band under every curved edge.
                Cutting the element above leaves whatever is behind the page
                showing through, so the two sides always agree. */}
            <clipPath id="card-curve" clipPathUnits="objectBoundingBox">
              <path d="M0,0 H1 V0.645 C0.78,0.575 0.40,0.555 0,0.70 Z" />
            </clipPath>
            {/* The same idea at page scale: a band that ends on a sweep cuts
                its own foot, instead of the next band painting a hill over it. */}
            <clipPath id="section-curve" clipPathUnits="objectBoundingBox">
              <path d="M0,0 H1 V0.985 C0.70,0.934 0.34,0.944 0,1 Z" />
            </clipPath>
          </defs>
        </svg>
        <GroundCanvas />
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
