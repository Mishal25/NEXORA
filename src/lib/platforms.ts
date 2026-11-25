import type { PlatformId } from '../types'

export interface PlatformConfig {
  id: PlatformId
  name: string
  color: string
  charLimit: number
  hashtagRange: string
  maxHashtags: number
  captionStyle: string
  rules: string[]
  keywordTip: string
}

export const PLATFORMS: Record<PlatformId, PlatformConfig> = {
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    color: '#E1306C',
    charLimit: 2200,
    hashtagRange: '3-15',
    maxHashtags: 15,
    captionStyle: 'Emotive, visual, strong first line, line breaks.',
    rules: ['Lead with a hook before the "more" cut-off', 'Mix niche and broad hashtags', 'Add a clear call to action'],
    keywordTip: 'Use searchable keywords in the first sentence; Instagram search reads captions.',
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    color: '#0A66C2',
    charLimit: 3000,
    hashtagRange: '3-5',
    maxHashtags: 5,
    captionStyle: 'Professional insight, short paragraphs, minimal emoji.',
    rules: ['Hook in the first two lines', 'Share a lesson or takeaway', 'Keep hashtags at the end'],
    keywordTip: 'Use industry terms your peers search for.',
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    color: '#1877F2',
    charLimit: 63206,
    hashtagRange: '1-3',
    maxHashtags: 3,
    captionStyle: 'Conversational, community-driven, ask a question.',
    rules: ['Keep it short and personal', 'Ask a question to invite comments', 'Use hashtags sparingly'],
    keywordTip: 'Use plain-language keywords your community would use.',
  },
  x: {
    id: 'x',
    name: 'X (Twitter)',
    color: '#111827',
    charLimit: 280,
    hashtagRange: '1-2',
    maxHashtags: 2,
    captionStyle: 'Punchy and concise within 280 characters.',
    rules: ['Stay under 280 characters total', 'Use at most 1-2 hashtags', 'Put the point first'],
    keywordTip: 'Use the single strongest keyword as your hashtag.',
  },
  pinterest: {
    id: 'pinterest',
    name: 'Pinterest',
    color: '#E60023',
    charLimit: 500,
    hashtagRange: '2-5',
    maxHashtags: 5,
    captionStyle: 'Descriptive, searchable, inspiration-led.',
    rules: ['Write keyword-rich descriptions', 'Describe what the viewer will learn or get', 'Stay under 500 characters'],
    keywordTip: 'Pinterest is a search engine: front-load descriptive keywords.',
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    color: '#FF0000',
    charLimit: 5000,
    hashtagRange: '3-5',
    maxHashtags: 5,
    captionStyle: 'Title-and-description mindset with a clear call to action.',
    rules: ['Put key terms in the first 2 lines', 'Keep to 3-5 hashtags', 'Add a subscribe / watch-next prompt'],
    keywordTip: 'Match terms people type into YouTube search.',
  },
  threads: {
    id: 'threads',
    name: 'Threads',
    color: '#000000',
    charLimit: 500,
    hashtagRange: '0-3',
    maxHashtags: 3,
    captionStyle: 'Casual, conversational, short.',
    rules: ['Write like you talk', 'Use a single topic tag at most', 'Invite replies'],
    keywordTip: 'One clear topic keyword works better than many.',
  },
}

export const PLATFORM_LIST = Object.values(PLATFORMS)

export const CATEGORIES = [
  'Technology',
  'AI and Machine Learning',
  'Education',
  'Fashion',
  'Travel',
  'Photography',
  'Business',
  'Fitness',
  'Lifestyle',
  'Gaming',
  'Entertainment',
]

export const CAPTION_STYLES = [
  'Professional',
  'Creative',
  'Classy',
  'Attitude',
  'Minimal',
  'Inspirational',
  'Funny',
  'Educational',
  'Storytelling',
  'Business and Marketing',
]

export const LANGUAGES = ['English', 'Hindi', 'Gujarati', 'Hinglish']

/** Search page for a platform. These are plain search links, never guessed profile URLs. */
export function searchUrl(platform: PlatformId, q: string): string {
  const e = encodeURIComponent(q)
  switch (platform) {
    case 'instagram':
      return `https://www.instagram.com/explore/search/keyword/?q=${e}`
    case 'linkedin':
      return `https://www.linkedin.com/search/results/all/?keywords=${e}`
    case 'facebook':
      return `https://www.facebook.com/search/pages/?q=${e}`
    case 'x':
      return `https://x.com/search?q=${e}&f=user`
    case 'pinterest':
      return `https://www.pinterest.com/search/users/?q=${e}`
    case 'youtube':
      return `https://www.youtube.com/results?search_query=${e}`
    case 'threads':
      return `https://www.threads.net/search?q=${e}&serp_type=accounts`
  }
}
