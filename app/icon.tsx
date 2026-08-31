import { ImageResponse } from 'next/og'
import { BRAND_COLORS, BRAND_MARK_PATH, BRAND_MARK_VIEWBOX } from '@/lib/brand'

export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

// A favicon is read at 16px in a crowded tab strip, so the mark is knocked out
// of a solid brand field: the colour does the separating, with no outline and
// no second shape competing for the same few pixels.
export default function Icon() {
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
        <svg width="24" height="24" viewBox={BRAND_MARK_VIEWBOX} fill={BRAND_COLORS.paper}>
          <path d={BRAND_MARK_PATH} />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
