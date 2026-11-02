import { afterEach, describe, expect, it, vi } from 'vitest'

// canvas.toBlob is allowed to ignore the type it was asked for: the HTML spec
// tells it to fall back to image/png when it cannot encode the request, and the
// callback still receives a perfectly valid blob. WebKit has no WebP encoder, so
// on iOS every variant came back as a PNG named .webp, and Supabase Storage —
// which reads the type off the blob, not off the contentType option — rejected
// the upload with an opaque 400. These tests stand in for the browser that
// cannot encode WebP, because nothing in the UI shows the difference.

interface FakeCanvas {
  width: number
  height: number
  getContext: () => Record<string, unknown>
  toBlob: (callback: (blob: Blob | null) => void, type?: string, quality?: number) => void
}

function installCanvas(encode: (requested: string) => string | null) {
  const created: string[] = []
  const stub = {
    createElement: (tag: string): FakeCanvas => {
      if (tag !== 'canvas') throw new Error(`unexpected element: ${tag}`)
      const canvas: FakeCanvas = {
        width: 0,
        height: 0,
        getContext: () => ({
          fillStyle: '',
          fillRect: () => {},
          drawImage: () => {}
        }),
        toBlob: (callback, type = 'image/png') => {
          const produced = encode(type)
          created.push(`${type} -> ${produced ?? 'null'}`)
          callback(produced ? new Blob(['x'], { type: produced }) : null)
        }
      }
      return canvas
    }
  }
  vi.stubGlobal('document', stub)
  return created
}

// The module memoises the probe, so each case needs a fresh copy.
async function loadModule() {
  vi.resetModules()
  return import('./image-processing')
}

const source = { width: 2400, height: 1800 } as unknown as HTMLCanvasElement

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('variant encoding picks a container the browser can actually produce', () => {
  it('stores WebP where the browser encodes it', async () => {
    installCanvas((requested) => requested)
    const { generateImageVariants } = await loadModule()

    const variants = await generateImageVariants(source)

    expect(variants.format).toBe('webp')
    expect(variants.cardBlob.type).toBe('image/webp')
    expect(variants.fullBlob.type).toBe('image/webp')
  })

  it('falls back to JPEG on a browser that silently answers WebP with PNG', async () => {
    installCanvas((requested) => (requested === 'image/webp' ? 'image/png' : requested))
    const { generateImageVariants } = await loadModule()

    const variants = await generateImageVariants(source)

    // The container has to be one the upload path can name honestly — a PNG
    // under a .webp name is what the storage bucket rejected.
    expect(variants.format).toBe('jpg')
    expect(variants.cardBlob.type).toBe('image/jpeg')
    expect(variants.fullBlob.type).toBe('image/jpeg')
  })

  it('probes once and keeps both variants in the same container', async () => {
    const calls = installCanvas((requested) =>
      requested === 'image/webp' ? 'image/png' : requested
    )
    const { generateImageVariants } = await loadModule()

    await generateImageVariants(source)
    await generateImageVariants(source)

    const webpAttempts = calls.filter((call) => call.startsWith('image/webp')).length
    expect(webpAttempts).toBe(1)
    expect(calls.filter((call) => call.startsWith('image/jpeg'))).toHaveLength(4)
  })

  it('refuses a blob whose type drifted from the request', async () => {
    installCanvas(() => 'image/png')
    const { generateImageVariants } = await loadModule()

    await expect(generateImageVariants(source)).rejects.toThrow('image_encode_failed')
  })

  it('refuses an encoder that returns nothing at all', async () => {
    installCanvas(() => null)
    const { generateImageVariants } = await loadModule()

    await expect(generateImageVariants(source)).rejects.toThrow('image_encode_failed')
  })
})
