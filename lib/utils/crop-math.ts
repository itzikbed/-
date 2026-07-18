export interface CropAreaPixels {
  x: number
  y: number
  width: number
  height: number
}

export type Rotation = 0 | 90 | 180 | 270

export interface CropGeometry {
  bounds: { width: number; height: number }
  translate: { x: number; y: number }
  rotationRad: number
  drawOffset: { x: number; y: number }
  output: CropAreaPixels
}

export function rotatedBounds(
  width: number,
  height: number,
  rotation: Rotation
): { width: number; height: number } {
  return rotation % 180 === 0 ? { width, height } : { width: height, height: width }
}

export function clampCropToBounds(
  crop: CropAreaPixels,
  bounds: { width: number; height: number }
): CropAreaPixels {
  const maxX = Math.max(bounds.width - 1, 0)
  const maxY = Math.max(bounds.height - 1, 0)
  const x = Math.min(Math.max(Math.round(crop.x), 0), maxX)
  const y = Math.min(Math.max(Math.round(crop.y), 0), maxY)
  const width = Math.max(1, Math.min(Math.round(crop.width), bounds.width - x))
  const height = Math.max(1, Math.min(Math.round(crop.height), bounds.height - y))
  return { x, y, width, height }
}

// The crop rect reported by the editor is relative to the ROTATED image, so the
// draw happens in two steps: rotate the source around the center of its rotated
// bounding box, then cut the clamped crop rect out of that box.
export function cropGeometry(
  srcWidth: number,
  srcHeight: number,
  crop: CropAreaPixels,
  rotation: Rotation
): CropGeometry {
  const bounds = rotatedBounds(srcWidth, srcHeight, rotation)
  return {
    bounds,
    translate: { x: bounds.width / 2, y: bounds.height / 2 },
    rotationRad: (rotation * Math.PI) / 180,
    drawOffset: { x: -srcWidth / 2, y: -srcHeight / 2 },
    output: clampCropToBounds(crop, bounds)
  }
}
