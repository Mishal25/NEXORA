export type PlatformId = 'instagram' | 'linkedin' | 'facebook' | 'x' | 'pinterest' | 'youtube' | 'threads'

export type Level3 = 'low' | 'medium' | 'high'
export type HashtagGroup = 'trending' | 'popular' | 'niche' | 'community' | 'professional' | 'location' | 'brand'

export interface PlatformFit {
  platform: PlatformId
  fit: number
  reason: string
}

export interface Analysis {
  description: string
  mainSubject: string
  category: string
  audience: string[]
  keywords: string[]
  objects: string[]
  setting: string
  mood: string
  uncertainties: string[]
  platforms: PlatformFit[]
}

export interface Hashtag {
  tag: string
  group: HashtagGroup
  popularity: Level3
  relevance: number
  competition: Level3
  reason: string
}

export interface Caption {
  text: string
  hashtags: string[]
  keywords: string[]
  style: string
}

export type AccountType = 'brand' | 'company' | 'organization' | 'community' | 'institution' | 'page' | 'creator'
export interface TagSuggestion {
  name: string
  type: AccountType
  platform: PlatformId
  reason: string
  confidence: number
}

export interface Criterion {
  key: 'caption' | 'hashtags' | 'keywords' | 'tagging' | 'platform' | 'audience' | 'clarity'
  score: number
  note: string
}
export interface OptimizeResult {
  criteria: Criterion[]
  suggestions: { priority: 'high' | 'medium' | 'low'; text: string }[]
  improvedCaption: string
}

export interface TrendTopic {
  title: string
  summary: string
  relatedHashtags: string[]
}
export interface TrendHashtag {
  tag: string
  popularity: Level3
  competition: Level3
  relevance: number
  direction: 'rising' | 'steady' | 'unknown'
  reason: string
  related: string[]
}
export interface TrendResult {
  topics: TrendTopic[]
  hashtags: TrendHashtag[]
  source: { id: string; label: string; live: boolean; generatedAt: string }
}

export type SavedType = 'hashtag' | 'caption' | 'tag' | 'image' | 'post'
export interface SavedItem {
  id: string
  type: SavedType
  title: string
  content: string
  platform?: PlatformId
  note?: string
  thumb?: string
  createdAt: string
}

export type ActivityKind = 'analysis' | 'hashtags' | 'captions' | 'tags' | 'optimize' | 'explore' | 'save' | 'post'
export interface Activity {
  id: string
  kind: ActivityKind
  label: string
  platform?: PlatformId
  at: string
}

export interface ProjectRecord {
  id: string
  title: string
  thumb: string
  category: string
  description: string
  keywords: string[]
  createdAt: string
}

export type PlanId = 'free' | 'pro'
export interface Usage {
  month: string
  aiCalls: number
  analyses: number
}

export interface AppData {
  projects: ProjectRecord[]
  saved: SavedItem[]
  activity: Activity[]
  hashtagsGenerated: number
  imagesAnalyzed: number
  usage: Usage
  plan: PlanId
}

export interface AppUser {
  uid: string
  name: string
  email: string
  mode: 'firebase' | 'demo'
}
