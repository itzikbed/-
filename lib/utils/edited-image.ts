import { CropAreaPixels, Rotation, cropGeometry } from './crop-math'
import { generateImageVariants } from './image-processing'

// The source is an already-stored webp variant, so EXIF (incl. GPS) was already
// stripped on first upload and there is no HEIC path here.
export async function processEditedImage(
  source: Blob,
  crop: CropAreaPixels,
  rotation: Rotation
): Promise<{ cardBlob: Blob; fullBlob: Blob }> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(source)
  } catch (err) {
    console.error('Edited image decode failed', err)
    throw new Error('image_decode_failed')
  }

  const geometry = cropGeometry(bitmap.width, bitmap.height, crop, rotation)

  const rotated = document.createElement('canvas')
  rotated.width = geometry.bounds.width
  rotated.height = geometry.bounds.height
  const rotatedCtx = rotated.getContext('2d')
  if (!rotatedCtx) {
    bitmap.close()
    throw new Error('Could not get canvas context')
  }
  rotatedCtx.translate(geometry.translate.x, geometry.translate.y)
  rotatedCtx.rotate(geometry.rotationRad)
  rotatedCtx.drawImage(bitmap, geometry.drawOffset.x, geometry.drawOffset.y)
  bitmap.close()

  const output = document.createElement('canvas')
  output.width = geometry.output.width
  output.height = geometry.output.height
  const outputCtx = output.getContext('2d')
  if (!outputCtx) {
    throw new Error('Could not get canvas context')
  }
  outputCtx.drawImage(
    rotated,
    geometry.output.x,
    geometry.output.y,
    geometry.output.width,
    geometry.output.height,
    0,
    0,
    geometry.output.width,
    geometry.output.height
  )

  return generateImageVariants(output)
}
