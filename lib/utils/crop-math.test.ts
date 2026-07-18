import { describe, it, expect } from 'vitest'
import { rotatedBounds, clampCropToBounds, cropGeometry } from './crop-math'

describe('rotatedBounds', () => {
  it('keeps dimensions at 0 and 180 degrees', () => {
    expect(rotatedBounds(400, 300, 0)).toEqual({ width: 400, height: 300 })
    expect(rotatedBounds(400, 300, 180)).toEqual({ width: 400, height: 300 })
  })

  it('swaps dimensions at 90 and 270 degrees', () => {
    expect(rotatedBounds(400, 300, 90)).toEqual({ width: 300, height: 400 })
    expect(rotatedBounds(400, 300, 270)).toEqual({ width: 300, height: 400 })
  })
})

describe('clampCropToBounds', () => {
  const bounds = { width: 400, height: 300 }

  it('passes through a rect that is fully inside', () => {
    expect(clampCropToBounds({ x: 10, y: 20, width: 100, height: 50 }, bounds))
      .toEqual({ x: 10, y: 20, width: 100, height: 50 })
  })

  it('clamps negative origins to zero and trims the size to fit', () => {
    expect(clampCropToBounds({ x: -15, y: -8, width: 500, height: 400 }, bounds))
      .toEqual({ x: 0, y: 0, width: 400, height: 300 })
  })

  it('trims a rect that overflows past the far edge', () => {
    expect(clampCropToBounds({ x: 350, y: 250, width: 200, height: 200 }, bounds))
      .toEqual({ x: 350, y: 250, width: 50, height: 50 })
  })

  it('rounds fractional editor coordinates to integers', () => {
    expect(clampCropToBounds({ x: 10.4, y: 19.6, width: 99.5, height: 50.2 }, bounds))
      .toEqual({ x: 10, y: 20, width: 100, height: 50 })
  })

  it('never returns a degenerate rect', () => {
    expect(clampCropToBounds({ x: 0, y: 0, width: 0, height: 0 }, bounds))
      .toEqual({ x: 0, y: 0, width: 1, height: 1 })
  })
})

describe('cropGeometry', () => {
  it('is an identity frame at rotation 0 with a full-image crop', () => {
    const geo = cropGeometry(400, 300, { x: 0, y: 0, width: 400, height: 300 }, 0)
    expect(geo.bounds).toEqual({ width: 400, height: 300 })
    expect(geo.translate).toEqual({ x: 200, y: 150 })
    expect(geo.rotationRad).toBe(0)
    expect(geo.drawOffset).toEqual({ x: -200, y: -150 })
    expect(geo.output).toEqual({ x: 0, y: 0, width: 400, height: 300 })
  })

  it('rotates the frame and keeps the crop inside the swapped bounds at 90 degrees', () => {
    const geo = cropGeometry(400, 300, { x: 0, y: 0, width: 300, height: 400 }, 90)
    expect(geo.bounds).toEqual({ width: 300, height: 400 })
    expect(geo.translate).toEqual({ x: 150, y: 200 })
    expect(geo.rotationRad).toBeCloseTo(Math.PI / 2)
    expect(geo.drawOffset).toEqual({ x: -200, y: -150 })
    expect(geo.output).toEqual({ x: 0, y: 0, width: 300, height: 400 })
  })

  it('clamps a crop rect that was measured against the pre-rotation bounds', () => {
    const geo = cropGeometry(400, 300, { x: 320, y: 40, width: 80, height: 80 }, 90)
    expect(geo.bounds).toEqual({ width: 300, height: 400 })
    expect(geo.output).toEqual({ x: 299, y: 40, width: 1, height: 80 })
  })

  it('keeps a partial crop unchanged at 270 degrees when it already fits', () => {
    const geo = cropGeometry(400, 300, { x: 25, y: 60, width: 200, height: 150 }, 270)
    expect(geo.bounds).toEqual({ width: 300, height: 400 })
    expect(geo.rotationRad).toBeCloseTo((3 * Math.PI) / 2)
    expect(geo.output).toEqual({ x: 25, y: 60, width: 200, height: 150 })
  })
})
