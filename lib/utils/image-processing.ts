type VariantSource = ImageBitmap | HTMLCanvasElement

async function encodeVariant(
  source: VariantSource,
  maxEdge: number,
  quality: number
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

  ctx.drawImage(source, 0, 0, width, height)

  // Re-encode to WebP (fallback to JPEG if needed)
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          // Fallback to jpeg
          canvas.toBlob(
            (fallbackBlob) => {
              if (fallbackBlob) resolve(fallbackBlob)
              else reject(new Error('Canvas to Blob returned null'))
            },
            'image/jpeg',
            quality
          )
        }
      },
      'image/webp',
      quality
    )
  })
}

// Shared tail of the pipeline: canvas re-encode (strips EXIF incl. GPS) into the
// two stored variants — card (grids) and full (detail page).
export async function generateImageVariants(
  source: VariantSource
): Promise<{ cardBlob: Blob; fullBlob: Blob }> {
  const cardBlob = await encodeVariant(source, 480, 0.78)
  const fullBlob = await encodeVariant(source, 1600, 0.82)
  return { cardBlob, fullBlob }
}

export async function processImageFile(
  file: File
): Promise<{ cardBlob: Blob; fullBlob: Blob }> {
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
