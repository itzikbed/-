import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://homeforcats.org'
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/publish', '/requests', '/adopt'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
