export async function processImageFile(
  file: File
): Promise<{ cardBlob: Blob; fullBlob: Blob }> {
  // 1. Detect HEIC and convert to JPEG blob
  let sourceFile: Blob | File = file
  const isHeic = file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic'
  
  if (isHeic) {
    const heic2any = (await import('heic2any')).default
    const converted = await heic2any({ blob: file, toType: 'image/jpeg' })
    sourceFile = Array.isArray(converted) ? converted[0] : converted
  }

  // 2. Decode using createImageBitmap to apply EXIF orientation automatically
  const imageBitmap = await createImageBitmap(sourceFile, { imageOrientation: 'from-image' })
  const originalWidth = imageBitmap.width
  const originalHeight = imageBitmap.height

  // 3. Helper to resize and draw to canvas, then get blob
  const getVariantBlob = async (maxEdge: number, quality: number): Promise<Blob> => {
    let width = originalWidth
    let height = originalHeight

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

    // Draw the image bitmap to the canvas
    ctx.drawImage(imageBitmap, 0, 0, width, height)

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

  // Generate variants
  const cardBlob = await getVariantBlob(480, 0.78)
  const fullBlob = await getVariantBlob(1600, 0.82)

  // Clean up ImageBitmap
  imageBitmap.close()

  return { cardBlob, fullBlob }
}
