import type { PlanId } from '../types'

export interface PlanLimits {
  name: string
  price: string
  aiCallsPerMonth: number
  analysesPerMonth: number
  savedItems: number
  captionVariants: number
  advancedOptimizer: boolean
  advancedAnalytics: boolean
  features: string[]
}

export const PLANS: Record<PlanId, PlanLimits> = {
  free: {
    name: 'Free',
    price: '$0',
    aiCallsPerMonth: 30,
    analysesPerMonth: 5,
    savedItems: 25,
    captionVariants: 3,
    advancedOptimizer: false,
    advancedAnalytics: false,
    features: [
      '5 AI photo analyses / month',
      '30 AI requests / month',
      'Basic hashtag recommendations',
      '3 caption options per request',
      'Save up to 25 items',
      'Basic post score',
    ],
  },
  pro: {
    name: 'Pro',
    price: '$12',
    aiCallsPerMonth: 600,
    analysesPerMonth: 100,
    savedItems: 1000,
    captionVariants: 5,
    advancedOptimizer: true,
    advancedAnalytics: true,
    features: [
      '100 AI photo analyses / month',
      '600 AI requests / month',
      'Advanced hashtag analysis',
      '5 caption options per request',
      'Save up to 1,000 items',
      'Advanced post optimization with rewrite',
      'Advanced analytics',
    ],
  },
}

export type LimitKind = 'aiCalls' | 'analyses'

export function monthKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
