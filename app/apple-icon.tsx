import { ImageResponse } from 'next/og'
import {
  BRAND_COLORS,
  BRAND_MARK_PATH,
  BRAND_MARK_VIEWBOX,
  BRAND_MARK_WINDOW
} from '@/lib/brand'

export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

// At home-screen size there is room for the window, which is offset from centre
// so the mark is never perfectly symmetrical.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: BRAND_COLORS.pine,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="120" height="120" viewBox={BRAND_MARK_VIEWBOX} fill={BRAND_COLORS.paper}>
          <path d={BRAND_MARK_PATH} />
          <path d={BRAND_MARK_WINDOW} fill={BRAND_COLORS.pine} />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
