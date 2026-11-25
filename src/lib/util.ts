export const uid = (): string => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    let ok = false
    try {
      ok = document.execCommand('copy')
    } catch {
      ok = false
    }
    ta.remove()
    return ok
  }
}

export function downloadText(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export const hashify = (tag: string): string => '#' + tag.replace(/^#+/, '').replace(/[^\p{L}\p{N}_]/gu, '')

export function timeAgo(iso: string): string {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}

export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_FILE_MB = 10

export interface PreparedImage {
  name: string
  mime: string
  /** resized JPEG/PNG/WEBP data URL for preview */
  dataUrl: string
  /** base64 payload (no prefix) sent to the server */
  base64: string
  /** tiny thumbnail for saved items */
  thumb: string
}

export function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return 'Please upload a JPG, JPEG, PNG or WEBP image.'
  if (file.size > MAX_FILE_MB * 1024 * 1024) return `Image is larger than ${MAX_FILE_MB} MB.`
  return null
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('This file could not be read as an image.'))
    img.src = url
  })
}

function scaled(img: HTMLImageElement, max: number, mime: string, quality: number): string {
  const r = Math.min(1, max / Math.max(img.width, img.height))
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(img.width * r))
  c.height = Math.max(1, Math.round(img.height * r))
  c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height)
  return c.toDataURL(mime, quality)
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  const err = validateFile(file)
  if (err) throw new Error(err)
  const objectUrl = URL.createObjectURL(file)
  try {
    const img = await loadImage(objectUrl)
    // Downscale so the request stays small and fast; JPEG keeps payload predictable.
    const dataUrl = scaled(img, 1280, 'image/jpeg', 0.85)
    return {
      name: file.name,
      mime: 'image/jpeg',
      dataUrl,
      base64: dataUrl.split(',')[1] ?? '',
      thumb: scaled(img, 160, 'image/jpeg', 0.6),
    }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
