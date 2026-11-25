import { useCallback, useState } from 'react'
import { useStore } from './store'
import type { LimitKind } from './plans'

/**
 * Wraps an AI request with plan-limit checks, loading and error state.
 * Usage is only charged when the request succeeds.
 */
export function useAction() {
  const { checkLimit, charge } = useStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const run = useCallback(
    async function run<T>(kind: LimitKind, fn: () => Promise<T>): Promise<T | null> {
      const limit = checkLimit(kind)
      if (limit) {
        setError(limit)
        return null
      }
      setLoading(true)
      setError('')
      try {
        const r = await fn()
        charge(kind)
        return r
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
        return null
      } finally {
        setLoading(false)
      }
    },
    [checkLimit, charge],
  )

  return { run, loading, error, setError }
}
