type VariantSource = ImageBitmap | HTMLCanvasElement

// The two containers the stored-media grammar accepts (lib/security/media.ts).
// WebP is the house format; JPEG is the fallback for browsers that cannot encode
// it, which in practice means every browser on iOS — they all run WebKit.
export type VariantFormat = 'webp' | 'jpg'

const MIME_BY_FORMAT: Record<VariantFormat, string> = {
  webp: 'image/webp',
  jpg: 'image/jpeg'
}

let webpEncoderSupport: Promise<boolean> | null = null

// canvas.toBlob does not fail when it cannot encode the type it was asked for:
// the HTML spec tells it to fall back to image/png, so the callback still gets a
// perfectly valid blob carrying the wrong type. Supabase Storage reads that type
// off the multipart part (the contentType option is ignored for a Blob body), so
// an unchecked PNG is rejected by the bucket's mime allowlist and the whole
// upload dies with an opaque 400. Probe once, on a 1x1 canvas, and believe the
// type that comes back rather than the one we asked for.
function supportsWebpEncoding(): Promise<boolean> {
  if (!webpEncoderSupport) {
    webpEncoderSupport = new Promise<boolean>((resolve) => {
      const probe = document.createElement('canvas')
      probe.width = 1
      probe.height = 1
      probe.toBlob((blob) => resolve(blob?.type === MIME_BY_FORMAT.webp), MIME_BY_FORMAT.webp)
    })
  }
  return webpEncoderSupport
}

async function encodeVariant(
  source: VariantSource,
  maxEdge: number,
  quality: number,
  format: VariantFormat
): Promise<Blob> {
  let width = source.width
  let height = source.height

  if (width > maxEdge || height > maxEdge) {
    if (width > height) {
      height = Math.round((height * maxEdge) / width)
      width = maxEdge
    } else {
      width = Math.round((width * maxEdge) / height)
      height = maxEdge
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Could not get canvas context')
  }

  // JPEG has no alpha channel, so a transparent source would composite onto
  // black. Lay down white first and the edges stay clean.
  if (format === 'jpg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
  }

  ctx.drawImage(source, 0, 0, width, height)

  const mimeType = MIME_BY_FORMAT[format]
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mimeType, quality)
  })

  // A blob whose type drifted from the one we asked for would be uploaded under
  // a path promising the other container, and the magic-byte check in
  // lib/security/verify-stored-media.ts would reject it at publish time.
  if (!blob || blob.type !== mimeType) {
    throw new Error('image_encode_failed')
  }

  return blob
}

// Shared tail of the pipeline: canvas re-encode (strips EXIF incl. GPS) into the
// two stored variants — card (grids) and full (detail page). Both variants share
// one container so the stored pair stays consistent.
export async function generateImageVariants(
  source: VariantSource
): Promise<{ cardBlob: Blob; fullBlob: Blob; format: VariantFormat }> {
  const format: VariantFormat = (await supportsWebpEncoding()) ? 'webp' : 'jpg'
  const cardBlob = await encodeVariant(source, 480, 0.78, format)
  const fullBlob = await encodeVariant(source, 1600, 0.82, format)
  return { cardBlob, fullBlob, format }
}

export async function processImageFile(
  file: File
): Promise<{ cardBlob: Blob; fullBlob: Blob; format: VariantFormat }> {
  let sourceFile: Blob | File = file
  const isHeic = file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic'

  let imageBitmap: ImageBitmap
  try {
    if (isHeic) {
      const heic2any = (await import('heic2any')).default
      const converted = await heic2any({ blob: file, toType: 'image/jpeg' })
      sourceFile = Array.isArray(converted) ? converted[0] : converted
    }

    // Decode using createImageBitmap to apply EXIF orientation automatically
    imageBitmap = await createImageBitmap(sourceFile, { imageOrientation: 'from-image' })
  } catch (err) {
    console.error('Image decode or HEIC conversion failed', err)
    throw new Error('image_decode_failed')
  }

  try {
    return await generateImageVariants(imageBitmap)
  } finally {
    imageBitmap.close()
  }
}
