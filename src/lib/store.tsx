import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Activity, ActivityKind, AppData, AppUser, PlanId, PlatformId, ProjectRecord, SavedItem } from '../types'
import { firebaseEnabled, getFirebase } from './firebase'
import { monthKey, PLANS, type LimitKind } from './plans'
import { uid } from './util'

const emptyData = (): AppData => ({
  projects: [],
  saved: [],
  activity: [],
  hashtagsGenerated: 0,
  imagesAnalyzed: 0,
  usage: { month: monthKey(), aiCalls: 0, analyses: 0 },
  plan: 'free',
})

function normalize(raw: Partial<AppData> | null | undefined): AppData {
  const d = { ...emptyData(), ...(raw ?? {}) }
  if (d.usage?.month !== monthKey()) d.usage = { month: monthKey(), aiCalls: 0, analyses: 0 }
  return d
}

interface StoreApi {
  data: AppData
  ready: boolean
  syncing: boolean
  /** Returns an error message if the plan limit is reached, otherwise null. */
  checkLimit(kind: LimitKind): string | null
  /** Call after a successful AI request. */
  charge(kind: LimitKind): void
  log(kind: ActivityKind, label: string, platform?: PlatformId): void
  addProject(p: Omit<ProjectRecord, 'id' | 'createdAt'>): void
  addHashtagsGenerated(n: number): void
  save(item: Omit<SavedItem, 'id' | 'createdAt'>): { ok: boolean; message: string }
  saveMany(items: Omit<SavedItem, 'id' | 'createdAt'>[]): { ok: boolean; message: string }
  updateSaved(id: string, patch: Partial<Pick<SavedItem, 'title' | 'content' | 'note'>>): void
  removeSaved(id: string): void
  isSaved(type: SavedItem['type'], content: string): boolean
  setPlan(p: PlanId): void
  clearAll(): void
}

const Ctx = createContext<StoreApi | null>(null)
const localKey = (uidv: string) => `nexora.data.${uidv}`

export function StoreProvider({ user, children }: { user: AppUser; children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => {
    try {
      return normalize(JSON.parse(localStorage.getItem(localKey(user.uid)) ?? 'null'))
    } catch {
      return emptyData()
    }
  })
  const [ready, setReady] = useState(user.mode !== 'firebase')
  const [syncing, setSyncing] = useState(false)
  const loaded = useRef(user.mode !== 'firebase')

  // Load from Firestore once for Firebase users (remote is the source of truth when present).
  useEffect(() => {
    if (user.mode !== 'firebase' || !firebaseEnabled) return
    let cancelled = false
    ;(async () => {
      try {
        const { db, fsMod } = await getFirebase()
        const snap = await fsMod.getDoc(fsMod.doc(db, 'users', user.uid, 'app', 'state'))
        if (!cancelled && snap.exists()) {
          const remote = JSON.parse((snap.data() as { json: string }).json) as Partial<AppData>
          setData(normalize(remote))
        }
      } catch {
        /* offline or rules not deployed: keep local data */
      } finally {
        loaded.current = true
        if (!cancelled) setReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user.uid, user.mode])

  // Persist: localStorage immediately, Firestore debounced.
  useEffect(() => {
    if (!loaded.current) return
    try {
      localStorage.setItem(localKey(user.uid), JSON.stringify(data))
    } catch {
      /* storage full: ignore */
    }
    if (user.mode !== 'firebase' || !firebaseEnabled) return
    const t = setTimeout(async () => {
      try {
        setSyncing(true)
        const { db, fsMod } = await getFirebase()
        let json = JSON.stringify(data)
        if (json.length > 900_000) {
          // Firestore documents are limited to 1 MiB: drop thumbnails if needed.
          json = JSON.stringify({ ...data, saved: data.saved.map((s) => ({ ...s, thumb: undefined })), projects: data.projects.map((p) => ({ ...p, thumb: '' })) })
        }
        await fsMod.setDoc(fsMod.doc(db, 'users', user.uid, 'app', 'state'), { json, updatedAt: new Date().toISOString() })
      } catch {
        /* keep working locally */
      } finally {
        setSyncing(false)
      }
    }, 1200)
    return () => clearTimeout(t)
  }, [data, user.uid, user.mode])

  const limits = PLANS[data.plan]

  const checkLimit = useCallback(
    (kind: LimitKind) => {
      if (kind === 'analyses' && data.usage.analyses >= limits.analysesPerMonth)
        return `You've used all ${limits.analysesPerMonth} photo analyses on the ${limits.name} plan this month.${data.plan === 'free' ? ' Upgrade to Pro for more.' : ''}`
      if (data.usage.aiCalls >= limits.aiCallsPerMonth)
        return `You've reached the ${limits.aiCallsPerMonth} AI requests included in the ${limits.name} plan this month.${data.plan === 'free' ? ' Upgrade to Pro for more.' : ''}`
      return null
    },
    [data.usage, limits, data.plan],
  )

  const charge = useCallback((kind: LimitKind) => {
    setData((d) => ({
      ...d,
      usage: { ...d.usage, aiCalls: d.usage.aiCalls + 1, analyses: d.usage.analyses + (kind === 'analyses' ? 1 : 0) },
    }))
  }, [])

  const log = useCallback((kind: ActivityKind, label: string, platform?: PlatformId) => {
    const a: Activity = { id: uid(), kind, label, platform, at: new Date().toISOString() }
    setData((d) => ({ ...d, activity: [a, ...d.activity].slice(0, 300) }))
  }, [])

  const addProject = useCallback((p: Omit<ProjectRecord, 'id' | 'createdAt'>) => {
    setData((d) => ({
      ...d,
      imagesAnalyzed: d.imagesAnalyzed + 1,
      projects: [{ ...p, id: uid(), createdAt: new Date().toISOString() }, ...d.projects].slice(0, 30),
    }))
  }, [])

  const addHashtagsGenerated = useCallback((n: number) => setData((d) => ({ ...d, hashtagsGenerated: d.hashtagsGenerated + n })), [])

  const saveMany = useCallback(
    (items: Omit<SavedItem, 'id' | 'createdAt'>[]) => {
      const existing = new Set(data.saved.map((s) => s.type + '::' + s.content))
      const fresh = items.filter((i) => !existing.has(i.type + '::' + i.content))
      if (!fresh.length) return { ok: false, message: 'Already in your collection.' }
      const room = limits.savedItems - data.saved.length
      if (room <= 0)
        return { ok: false, message: `Your ${limits.name} plan holds ${limits.savedItems} saved items.${data.plan === 'free' ? ' Delete some or upgrade to Pro.' : ''}` }
      const take = fresh.slice(0, room)
      const now = new Date().toISOString()
      setData((d) => ({
        ...d,
        saved: [...take.map((i) => ({ ...i, id: uid(), createdAt: now })), ...d.saved],
      }))
      const skipped = fresh.length - take.length
      return {
        ok: true,
        message: skipped ? `Saved ${take.length}. ${skipped} not saved (plan limit reached).` : take.length > 1 ? `Saved ${take.length} items.` : 'Saved to your collection.',
      }
    },
    [data.saved, data.plan, limits],
  )

  const save = useCallback((item: Omit<SavedItem, 'id' | 'createdAt'>) => saveMany([item]), [saveMany])

  const updateSaved = useCallback(
    (id: string, patch: Partial<Pick<SavedItem, 'title' | 'content' | 'note'>>) =>
      setData((d) => ({ ...d, saved: d.saved.map((s) => (s.id === id ? { ...s, ...patch } : s)) })),
    [],
  )
  const removeSaved = useCallback((id: string) => setData((d) => ({ ...d, saved: d.saved.filter((s) => s.id !== id) })), [])
  const isSaved = useCallback((type: SavedItem['type'], content: string) => data.saved.some((s) => s.type === type && s.content === content), [data.saved])
  const setPlan = useCallback((p: PlanId) => setData((d) => ({ ...d, plan: p })), [])
  const clearAll = useCallback(() => setData(emptyData()), [])

  const value = useMemo<StoreApi>(
    () => ({ data, ready, syncing, checkLimit, charge, log, addProject, addHashtagsGenerated, save, saveMany, updateSaved, removeSaved, isSaved, setPlan, clearAll }),
    [data, ready, syncing, checkLimit, charge, log, addProject, addHashtagsGenerated, save, saveMany, updateSaved, removeSaved, isSaved, setPlan, clearAll],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): StoreApi {
  const c = useContext(Ctx)
  if (!c) throw new Error('useStore must be used inside StoreProvider')
  return c
}
