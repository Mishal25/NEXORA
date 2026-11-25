import type { PlatformId, TagSuggestion, TrendResult } from '../types'
import { exploreTrends } from './ai'
import { searchUrl } from './platforms'

/**
 * Modular data-provider architecture.
 *
 * TrendProvider: returns hashtag/topic data. The built-in provider is AI-estimated and is always
 * labelled as such. To add live data, implement this interface against an official API or an
 * authorized data vendor (server-side, with its own key) and register it below.
 *
 * AccountProvider: finds accounts to tag. No public API exists for searching arbitrary profiles on
 * most platforms, so the built-in provider only produces *search links* the user opens on the
 * platform itself. It never returns invented usernames or profile URLs.
 */
export interface TrendProvider {
  id: string
  label: string
  live: boolean
  configured: boolean
  setupHint?: string
  explore(q: { query: string; platform: PlatformId; category: string }): Promise<TrendResult>
}

export const aiEstimatedProvider: TrendProvider = {
  id: 'gemini-estimate',
  label: 'AI-estimated (Gemini) - not live data',
  live: false,
  configured: true,
  async explore(q) {
    const r = await exploreTrends(q)
    return {
      topics: r.topics,
      hashtags: r.hashtags,
      source: { id: this.id, label: this.label, live: false, generatedAt: r.generatedAt },
    }
  },
}

/** Placeholder for an authorized live data vendor. Not connected in this version. */
export const liveTrendProviderStub: TrendProvider = {
  id: 'live-provider',
  label: 'Live trend provider (not connected)',
  live: true,
  configured: false,
  setupHint:
    'Implement TrendProvider in src/lib/providers.ts against an official API or authorized vendor, keep its key server-side in api/, then add it to TREND_PROVIDERS.',
  async explore() {
    throw new Error('No live trend provider is connected.')
  },
}

export const TREND_PROVIDERS: TrendProvider[] = [aiEstimatedProvider, liveTrendProviderStub]

export function activeTrendProvider(): TrendProvider {
  return TREND_PROVIDERS.find((p) => p.configured && p.live) ?? aiEstimatedProvider
}

export interface AccountProvider {
  id: string
  label: string
  verified: boolean
  searchLink(platform: PlatformId, query: string): string
}

export const platformSearchProvider: AccountProvider = {
  id: 'platform-search-link',
  label: 'Search on the platform (opens in a new tab)',
  verified: false,
  searchLink: searchUrl,
}

export function verificationLabel(_s: TagSuggestion): string {
  return 'AI suggestion - not verified'
}
