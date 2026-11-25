/**
 * NEXORA server-side AI function.
 * - Runs as a Vercel-style serverless function (default export) and is reused by
 *   the Vite dev server (handleAi). The Gemini key never reaches the browser.
 * - Env: GEMINI_API_KEY (required), GEMINI_MODEL (optional, default below).
 */

const DEFAULT_MODEL = 'gemini-2.5-flash'
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BASE64_CHARS = 5_000_000 // ~3.7 MB of image data
const TASKS = ['analyze', 'hashtags', 'captions', 'tags', 'optimize', 'explore'] as const
type Task = (typeof TASKS)[number]

interface Payload {
  image?: { mime: string; data: string }
  [key: string]: unknown
}
interface AiBody {
  task: Task
  payload: Payload
}
export interface HandlerResult {
  status: number
  json: unknown
}

const RULES = `You are the AI engine of NEXORA, a social media content assistant.
Hard rules:
- Respond with ONE valid JSON object only. No markdown, no commentary.
- Describe only what is actually visible or what the user stated. Never invent a location, person, brand, company or identity from an uncertain visual clue. If unsure, say so in plain words.
- Never fabricate usage counts, post counts, follower numbers, rankings or live-trend statistics. Popularity and competition are qualitative ESTIMATES only.
- Never invent usernames, handles or profile URLs. For account suggestions return display names of real, well-known entities/categories only, and flag them as unverified.
- Never promise virality or guaranteed reach.
- Hashtags: no spaces, no leading '#' in the "tag" field, letters/numbers/underscore only.`

const PLATFORM_NOTES: Record<string, string> = {
  instagram: 'Instagram: visual, emotive, line breaks, 3-15 hashtags, strong first line, up to 2200 chars.',
  linkedin: 'LinkedIn: professional insight tone, short paragraphs, 3-5 hashtags, minimal emoji, hook in first 2 lines.',
  facebook: 'Facebook: conversational, community oriented, 1-3 hashtags, questions invite comments.',
  x: 'X (Twitter): max 280 characters including hashtags, punchy, 1-2 hashtags.',
  pinterest: 'Pinterest: keyword-rich, descriptive, searchable phrasing, up to 500 chars, a few hashtags.',
  youtube: 'YouTube: title-and-description mindset, searchable keywords, 3-5 hashtags, call to action.',
  threads: 'Threads: casual, conversational, short, 0-3 topic tags.',
}

function clip(v: unknown, n = 1500): string {
  return typeof v === 'string' ? v.slice(0, n) : ''
}
function platformLine(p: unknown): string {
  const k = clip(p, 20)
  return PLATFORM_NOTES[k] ?? 'General social media.'
}

function buildPrompt(task: Task, p: Payload): string {
  const context = clip(p.context)
  const audience = clip(p.audience, 300)
  const platform = clip(p.platform, 20)
  const category = clip(p.category, 60)
  const analysis = p.analysis ? JSON.stringify(p.analysis).slice(0, 3000) : ''
  const base = `Platform guidance: ${platformLine(platform)}
User context: ${context || '(none)'}
Target audience: ${audience || '(not specified)'}
Content category: ${category || '(infer from content)'}
Image analysis so far: ${analysis || '(none)'}`

  switch (task) {
    case 'analyze':
      return `Analyze the attached image for social media use. ${base}
Return JSON: {"description": string (2-3 sentences, only what is visible), "mainSubject": string, "category": string (one of: Technology, AI and Machine Learning, Education, Fashion, Travel, Photography, Business, Fitness, Lifestyle, Gaming, Entertainment, Food, Nature, Other), "audience": string[] (3-5 groups), "keywords": string[] (10-15), "objects": string[], "setting": string, "mood": string, "uncertainties": string[] (things you could not confirm, e.g. location/brand), "platforms": [{"platform": "instagram|linkedin|facebook|x|pinterest|youtube|threads", "fit": number 0-100, "reason": string}] (all 7, sorted by fit)}`
    case 'hashtags':
      return `Generate hashtags${p.image ? ' for the attached image' : ''}. ${base}
Return JSON: {"hashtags": [{"tag": string, "group": "trending|popular|niche|community|professional|location|brand", "popularity": "high|medium|low", "relevance": number 0-100, "competition": "low|medium|high", "reason": string (one sentence)}]}
Give 5-6 per group (24-40 total). "trending" means topics plausibly active right now, but this is an estimate, not live data. Only include "location" hashtags if the user context names a place; otherwise return generic travel/place-style tags only if clearly relevant, else leave the group empty. "brand" tags only for brands the user mentioned or clearly visible generic brand-style tags; never guess a brand.`
    case 'captions': {
      const style = clip(p.style, 40) || 'Creative'
      const lang = clip(p.language, 20) || 'English'
      const count = Math.min(5, Math.max(3, Number(p.count) || 3))
      const tags = Array.isArray(p.hashtags) ? p.hashtags.slice(0, 20).join(' ') : ''
      return `Write ${count} DIFFERENT caption options${p.image ? ' for the attached image' : ''}. ${base}
Style: ${style}. Language: ${lang} (Hinglish = Hindi written in Latin script mixed with English; Gujarati and Hindi use native script).
Preferred hashtags to draw from: ${tags || '(choose your own)'}
Return JSON: {"captions": [{"text": string (caption body incl. natural emojis, platform-appropriate formatting, no hashtags in body), "hashtags": string[] (without #, suited to platform), "keywords": string[], "style": string}]}
Each caption must use a clearly different angle/hook.`
    }
    case 'tags':
      return `Suggest accounts worth tagging${p.image ? ' based on the attached image and' : ' based on'} the user's context. ${base}
Search query from user (may be empty): ${clip(p.query, 100)}
Return JSON: {"suggestions": [{"name": string (display name of a real, well-known brand/company/organization/community/institution/public page - NO handles, NO URLs), "type": "brand|company|organization|community|institution|page|creator", "platform": "instagram|linkedin|facebook|x|pinterest|youtube|threads", "reason": string, "confidence": number 0-100}]}
6-10 suggestions. Only suggest entities explicitly named in the user's context, clearly visible text/logos, or broadly relevant well-known communities for the topic. Lower confidence when inferred. Skip "creator" unless the user named a public figure.`
    case 'optimize': {
      const caption = clip(p.caption, 3000)
      const tags = Array.isArray(p.hashtags) ? p.hashtags.slice(0, 40).join(' ') : ''
      const mentions = Array.isArray(p.mentions) ? p.mentions.slice(0, 20).join(', ') : ''
      return `Audit this draft post. ${base}
Caption: """${caption}"""
Hashtags: ${tags || '(none)'}
Tagged accounts: ${mentions || '(none)'}
Return JSON: {"criteria": [{"key": "caption|hashtags|keywords|tagging|platform|audience|clarity", "score": number 0-100, "note": string}] (all 7 keys), "suggestions": [{"priority": "high|medium|low", "text": string}] (4-7 concrete fixes), "improvedCaption": string}
Be honest and specific. Do not promise viral reach or engagement.`
    }
    case 'explore':
      return `Explore social media topics and hashtags. ${base}
Search term: ${clip(p.query, 100) || '(none; show broadly relevant topics)'}
Return JSON: {"topics": [{"title": string, "summary": string (one sentence), "relatedHashtags": string[] (3-5)}] (5-6 topics), "hashtags": [{"tag": string, "popularity": "high|medium|low", "competition": "low|medium|high", "relevance": number 0-100, "direction": "rising|steady|unknown", "reason": string, "related": string[] (3-5)}] (10-14 items)}
These are model estimates, not live data: use direction "unknown" unless a topic is a well-established seasonal/evergreen pattern, and never state numbers of posts.`
  }
}

async function callGemini(prompt: string, image?: Payload['image']): Promise<unknown> {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw Object.assign(new Error('GEMINI_API_KEY is not configured on the server.'), { status: 503, code: 'NO_KEY' })
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL
  const parts: unknown[] = [{ text: prompt }]
  if (image) parts.push({ inlineData: { mimeType: image.mime, data: image.data } })

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: RULES }] },
      contents: [{ role: 'user', parts }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.8 },
    }),
  })
  if (!res.ok) {
    const status = res.status === 429 ? 429 : res.status === 400 || res.status === 403 ? 502 : 502
    const msg =
      res.status === 429
        ? 'The Gemini API rate limit was reached. Please wait a moment and try again.'
        : res.status === 403 || res.status === 400
          ? 'Gemini rejected the request. Check that GEMINI_API_KEY is valid and the model name is correct.'
          : 'The Gemini service had a problem. Please try again.'
    throw Object.assign(new Error(msg), { status })
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[]
    promptFeedback?: { blockReason?: string }
  }
  if (data.promptFeedback?.blockReason) {
    throw Object.assign(new Error('Gemini could not process this image or prompt (blocked by safety filters).'), { status: 422 })
  }
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? ''
  if (!text) throw Object.assign(new Error('Gemini returned an empty response.'), { status: 502 })
  try {
    return JSON.parse(text)
  } catch {
    const m = text.match(/\{[\s\S]*\}/)
    if (m) return JSON.parse(m[0])
    throw Object.assign(new Error('Gemini returned a response that could not be read.'), { status: 502 })
  }
}

export async function handleAi(body: unknown): Promise<HandlerResult> {
  const b = body as Partial<AiBody> | null
  if (!b || typeof b !== 'object' || !b.task || !TASKS.includes(b.task) || typeof b.payload !== 'object' || !b.payload) {
    return { status: 400, json: { error: 'Invalid request.' } }
  }
  const payload = b.payload
  if (payload.image) {
    const { mime, data } = payload.image
    if (!ALLOWED_MIME.includes(mime) || typeof data !== 'string' || !/^[A-Za-z0-9+/=]+$/.test(data.slice(0, 200))) {
      return { status: 400, json: { error: 'Unsupported image. Use JPG, PNG or WEBP.' } }
    }
    if (data.length > MAX_BASE64_CHARS) return { status: 413, json: { error: 'Image is too large.' } }
  }
  if (b.task === 'analyze' && !payload.image) return { status: 400, json: { error: 'An image is required for analysis.' } }
  try {
    const result = await callGemini(buildPrompt(b.task, payload), payload.image)
    return { status: 200, json: { result, model: process.env.GEMINI_MODEL || DEFAULT_MODEL, generatedAt: new Date().toISOString() } }
  } catch (e) {
    const err = e as Error & { status?: number; code?: string }
    return { status: err.status ?? 500, json: { error: err.message || 'Unexpected server error.', code: err.code } }
  }
}

// Vercel / Node serverless entry
export default async function handler(
  req: { method?: string; body?: unknown },
  res: { status: (n: number) => { json: (v: unknown) => void } },
) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const out = await handleAi(typeof req.body === 'string' ? JSON.parse(req.body) : req.body)
  return res.status(out.status).json(out.json)
}
