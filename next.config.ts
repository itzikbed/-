import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === 'development'

function getSupabaseUrl(): URL {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321')
  } catch {
    return new URL('http://127.0.0.1:54321')
  }
}

const supabaseUrl = getSupabaseUrl()
const supabaseOrigin = supabaseUrl.origin
const supabaseWebsocketOrigin = supabaseOrigin.replace(/^http/, 'ws')
// Cloudflare Turnstile requires its challenge origin in script-src and
// frame-src (https://developers.cloudflare.com/turnstile/reference/content-security-policy/)
const turnstileOrigin = 'https://challenges.cloudflare.com'
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${turnstileOrigin}${isDevelopment ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  `img-src 'self' data: blob: ${supabaseOrigin}`,
  `media-src 'self' blob: ${supabaseOrigin}`,
  `connect-src 'self' ${supabaseOrigin} ${supabaseWebsocketOrigin}${isDevelopment ? ' ws://localhost:*' : ''}`,
  `frame-src 'self' ${turnstileOrigin}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDevelopment || supabaseUrl.hostname === '127.0.0.1' || supabaseUrl.hostname === 'localhost' ? [] : ['upgrade-insecure-requests'])
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
  ...(isDevelopment
    ? []
    : [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }])
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  images: {
    unoptimized: process.env.NODE_ENV === "development" || 
                 process.env.NEXT_IMAGE_UNOPTIMIZED?.trim() === "true",
    localPatterns: [
      {
        pathname: '/api/media'
      }
    ],
    // The optimizer accepts nothing but /api/media. That route serves only paths
    // that a cat_photos/cats row already references, and those rows are written
    // only after the stored object passes the mimetype and magic-byte checks in
    // lib/security/verify-stored-media.ts. Signed storage URLs are deliberately
    // NOT allowed here: a publisher can put arbitrary bytes in their own storage
    // folder before that validation runs, and a remote pattern would hand those
    // bytes straight to the optimizer.
    formats: ['image/webp'],
    dangerouslyAllowSVG: false,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders
      },
      {
        // Hero media is versioned by filename (every swap ships new names),
        // so browsers and the CDN may cache it indefinitely.
        source: '/hero/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
        ]
      }
    ]
  }
};

export default nextConfig;
