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
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  `img-src 'self' data: blob: ${supabaseOrigin}`,
  `media-src 'self' blob: ${supabaseOrigin}`,
  `connect-src 'self' ${supabaseOrigin} ${supabaseWebsocketOrigin}${isDevelopment ? ' ws://localhost:*' : ''}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDevelopment ? [] : ['upgrade-insecure-requests'])
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
    : [{ key: 'Strict-Transport-Security', value: 'max-age=31536000' }])
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
    remotePatterns: [
      {
        protocol: supabaseUrl.protocol.replace(':', '') as 'http' | 'https',
        hostname: supabaseUrl.hostname,
        port: supabaseUrl.port,
        pathname: '/storage/v1/object/sign/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders
      }
    ]
  }
};

export default nextConfig;
