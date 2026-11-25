import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Analysis, Caption, Hashtag, PlatformId, TagSuggestion } from '../types'
import type { PreparedImage } from './util'

/** In-memory working state shared by the Analyzer, Hashtag, Tag, Caption and Post Builder pages. */
export interface Workspace {
  image: PreparedImage | null
  context: string
  audience: string
  platform: PlatformId
  analysis: Analysis | null
  hashtags: Hashtag[]
  captions: Caption[]
  selectedTags: string[]
  chosenAccounts: string[]
  finalCaption: string
}

const initial: Workspace = {
  image: null,
  context: '',
  audience: '',
  platform: 'instagram',
  analysis: null,
  hashtags: [],
  captions: [],
  selectedTags: [],
  chosenAccounts: [],
  finalCaption: '',
}

interface Api {
  ws: Workspace
  patch(p: Partial<Workspace>): void
  setImage(img: PreparedImage | null): void
  reset(): void
  accountsAsTagSuggestions?: TagSuggestion[]
}

const Ctx = createContext<Api | null>(null)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [ws, setWs] = useState<Workspace>(initial)
  const patch = useCallback((p: Partial<Workspace>) => setWs((w) => ({ ...w, ...p })), [])
  // A new image invalidates everything derived from the previous one.
  const setImage = useCallback(
    (image: PreparedImage | null) => setWs((w) => ({ ...w, image, analysis: null, hashtags: [], captions: [], selectedTags: [], chosenAccounts: [], finalCaption: '' })),
    [],
  )
  const reset = useCallback(() => setWs(initial), [])
  const value = useMemo(() => ({ ws, patch, setImage, reset }), [ws, patch, setImage, reset])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useWorkspace(): Api {
  const c = useContext(Ctx)
  if (!c) throw new Error('useWorkspace must be used inside WorkspaceProvider')
  return c
}
