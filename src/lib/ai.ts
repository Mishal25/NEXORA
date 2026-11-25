import type { Analysis, Caption, Hashtag, OptimizeResult, PlatformId, TagSuggestion, TrendResult } from '../types'
import type { PreparedImage } from './util'

interface Envelope<T> {
  result: T
  model: string
  generatedAt: string
}

export class AiError extends Error {
  code?: string
  constructor(message: string, code?: string) {
    super(message)
    this.code = code
  }
}

async function call<T>(task: string, payload: Record<string, unknown>): Promise<Envelope<T>> {
  let res: Response
  try {
    res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, payload }),
    })
  } catch {
    throw new AiError('Could not reach the NEXORA server. Check your connection and try again.')
  }
  let data: unknown = null
  try {
    data = await res.json()
  } catch {
    /* fall through */
  }
  if (!res.ok) {
    const d = data as { error?: string; code?: string } | null
    throw new AiError(d?.error ?? `Request failed (${res.status}).`, d?.code)
  }
  return data as Envelope<T>
}

const img = (i?: PreparedImage | null) => (i ? { image: { mime: i.mime, data: i.base64 } } : {})

export interface Ctx {
  image?: PreparedImage | null
  context?: string
  audience?: string
  platform?: PlatformId
  category?: string
  analysis?: Analysis | null
}

const base = (c: Ctx) => ({
  ...img(c.image),
  context: c.context,
  audience: c.audience,
  platform: c.platform,
  category: c.category,
  analysis: c.analysis ?? undefined,
})

export async function analyzeImage(c: Ctx): Promise<Analysis> {
  const r = await call<Analysis>('analyze', base(c))
  const a = r.result
  return {
    description: a.description ?? '',
    mainSubject: a.mainSubject ?? '',
    category: a.category ?? 'Other',
    audience: a.audience ?? [],
    keywords: a.keywords ?? [],
    objects: a.objects ?? [],
    setting: a.setting ?? '',
    mood: a.mood ?? '',
    uncertainties: a.uncertainties ?? [],
    platforms: (a.platforms ?? []).slice().sort((x, y) => y.fit - x.fit),
  }
}

export async function generateHashtags(c: Ctx): Promise<{ hashtags: Hashtag[]; generatedAt: string }> {
  const r = await call<{ hashtags: Hashtag[] }>('hashtags', base(c))
  const seen = new Set<string>()
  const hashtags = (r.result.hashtags ?? [])
    .map((h) => ({ ...h, tag: String(h.tag).replace(/^#+/, '').replace(/[^\p{L}\p{N}_]/gu, '') }))
    .filter((h) => h.tag && !seen.has(h.tag.toLowerCase()) && seen.add(h.tag.toLowerCase()))
  return { hashtags, generatedAt: r.generatedAt }
}

export async function generateCaptions(c: Ctx & { style: string; language: string; count: number; hashtags?: string[] }): Promise<Caption[]> {
  const r = await call<{ captions: Caption[] }>('captions', { ...base(c), style: c.style, language: c.language, count: c.count, hashtags: c.hashtags })
  return (r.result.captions ?? []).map((x) => ({
    text: x.text ?? '',
    hashtags: (x.hashtags ?? []).map((t) => t.replace(/^#+/, '')),
    keywords: x.keywords ?? [],
    style: x.style ?? c.style,
  }))
}

export async function suggestTags(c: Ctx & { query?: string }): Promise<TagSuggestion[]> {
  const r = await call<{ suggestions: TagSuggestion[] }>('tags', { ...base(c), query: c.query })
  return r.result.suggestions ?? []
}

export async function optimizePost(
  c: Ctx & { caption: string; hashtags: string[]; mentions: string[] },
): Promise<OptimizeResult> {
  const r = await call<OptimizeResult>('optimize', { ...base({ ...c, image: undefined }), caption: c.caption, hashtags: c.hashtags, mentions: c.mentions })
  return {
    criteria: r.result.criteria ?? [],
    suggestions: r.result.suggestions ?? [],
    improvedCaption: r.result.improvedCaption ?? '',
  }
}

export async function exploreTrends(c: { query: string; platform: PlatformId; category: string }): Promise<Omit<TrendResult, 'source'> & { generatedAt: string }> {
  const r = await call<{ topics: TrendResult['topics']; hashtags: TrendResult['hashtags'] }>('explore', c)
  return {
    topics: r.result.topics ?? [],
    hashtags: (r.result.hashtags ?? []).map((h) => ({ ...h, tag: String(h.tag).replace(/^#+/, ''), related: h.related ?? [] })),
    generatedAt: r.generatedAt,
  }
}
