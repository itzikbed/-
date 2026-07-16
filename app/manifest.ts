import { MetadataRoute } from 'next'
import { strings } from '@/lib/strings'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: strings.common.siteName,
    short_name: 'מיאו-אימוץ',
    description: strings.common.metaDesc,
    start_url: '/',
    display: 'standalone',
    background_color: '#F7F5F0',
    theme_color: '#1C6650',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      }
    ],
  }
}
