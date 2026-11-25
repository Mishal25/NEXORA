import { useMemo, useState } from 'react'
import { Badge, Button, Card, Empty, ErrorBox, Meter, PageHeader, Spinner, Icon, useToast } from '../components/ui'
import { EstimateNote, InputPanel, Levels } from '../components/Shared'
import { generateHashtags } from '../lib/ai'
import { PLATFORMS } from '../lib/platforms'
import { useStore } from '../lib/store'
import { useAction } from '../lib/useAction'
import { copyText, hashify } from '../lib/util'
import { useWorkspace } from '../lib/workspace'
import { navigate } from '../lib/router'
import type { Hashtag, HashtagGroup } from '../types'

const GROUPS: { id: HashtagGroup; label: string }[] = [
  { id: 'trending', label: 'Trending (AI-estimated)' },
  { id: 'popular', label: 'Popular' },
  { id: 'niche', label: 'Niche' },
  { id: 'community', label: 'Community' },
  { id: 'professional', label: 'Professional' },
  { id: 'location', label: 'Location-based' },
  { id: 'brand', label: 'Brand-related' },
]
type Filter = 'all' | 'relevance' | 'trending' | 'low' | 'professional' | 'reach'
const FILTERS: { id: Filter; label: string; test: (h: Hashtag) => boolean }[] = [
  { id: 'all', label: 'All', test: () => true },
  { id: 'relevance', label: 'High relevance', test: (h) => h.relevance >= 80 },
  { id: 'trending', label: 'Trending', test: (h) => h.group === 'trending' },
  { id: 'low', label: 'Low competition', test: (h) => h.competition === 'low' },
  { id: 'professional', label: 'Professional', test: (h) => h.group === 'professional' },
  { id: 'reach', label: 'Maximum reach', test: (h) => h.popularity === 'high' },
]
const tone = { low: 'green', medium: 'amber', high: 'red' } as const

export default function Hashtags() {
  const { ws, patch } = useWorkspace()
  const store = useStore()
  const toast = useToast()
  const { run, loading, error } = useAction()
  const [filter, setFilter] = useState<Filter>('all')
  const sel = ws.selectedTags
  const plat = PLATFORMS[ws.platform]

  const canGenerate = Boolean(ws.image || ws.context.trim() || ws.analysis)
  const generate = async () => {
    const r = await run('aiCalls', () => generateHashtags({ image: ws.image, context: ws.context, audience: ws.audience, platform: ws.platform, category: ws.analysis?.category, analysis: ws.analysis }))
    if (!r) return
    patch({ hashtags: r.hashtags, selectedTags: [] })
    store.addHashtagsGenerated(r.hashtags.length)
    store.log('hashtags', `Generated ${r.hashtags.length} hashtags`, ws.platform)
  }

  const shown = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter)!
    return ws.hashtags.filter(f.test)
  }, [ws.hashtags, filter])

  const toggle = (t: string) => patch({ selectedTags: sel.includes(t) ? sel.filter((x) => x !== t) : [...sel, t] })
  const selectShown = () => patch({ selectedTags: Array.from(new Set([...sel, ...shown.map((h) => h.tag)])) })
  const copySel = async () => { const ok = await copyText(sel.map(hashify).join(' ')); toast(ok ? `Copied ${sel.length} hashtags` : 'Could not copy.', ok ? 'ok' : 'err') }
  const saveSel = () => {
    const r = store.saveMany(sel.map((t) => ({ type: 'hashtag' as const, title: hashify(t), content: hashify(t), platform: ws.platform })))
    toast(r.message, r.ok ? 'ok' : 'err')
    if (r.ok) store.log('save', `Saved ${sel.length} hashtags`, ws.platform)
  }

  return (
    <>
      <PageHeader title="Hashtag Generator" subtitle="Seven kinds of hashtags tuned to your photo, audience and platform, each with a reason." />
      <div className="split">
        <Card className="stack">
          <InputPanel compact />
          <Button size="lg" icon="hash" loading={loading} disabled={!canGenerate} onClick={generate}>Generate hashtags</Button>
          {!canGenerate && <span className="xs muted">Upload a photo or add some context first.</span>}
          {ws.analysis && <span className="xs muted">Using your photo analysis ({ws.analysis.category}).</span>}
          {error && <ErrorBox message={error} onRetry={generate} />}
        </Card>

        <div>
          <EstimateNote />
          <p className="small muted mt">{plat.name} works best with {plat.hashtagRange} hashtags. {plat.keywordTip}</p>
          {loading && <Card className="mt"><Spinner label="Crafting hashtags..." /></Card>}
          {!loading && ws.hashtags.length === 0 && <Card className="mt"><Empty icon="hash" title="No hashtags yet">Fill in the left panel and click Generate hashtags.</Empty></Card>}
          {!loading && ws.hashtags.length > 0 && (
            <div className="fade-in">
              <div className="chips mt" role="group" aria-label="Filters">
                {FILTERS.map((f) => <button key={f.id} className={`chip ${filter === f.id ? 'active' : ''}`} onClick={() => setFilter(f.id)}>{f.label}</button>)}
              </div>
              <div className="row between mt small muted"><span>{shown.length} of {ws.hashtags.length} shown</span><Button size="sm" variant="ghost" onClick={selectShown} disabled={!shown.length}>Select all shown</Button></div>
              {shown.length === 0 && <Empty icon="search" title="Nothing matches this filter">Try another filter.</Empty>}
              {GROUPS.map((g) => {
                const items = shown.filter((h) => h.group === g.id)
                if (!items.length) return null
                return (
                  <section key={g.id}>
                    <div className="group-title">{g.label} <span>{items.length}</span></div>
                    <div className="tag-grid">
                      {items.map((h) => {
                        const on = sel.includes(h.tag)
                        return (
                          <div key={h.tag} className={`tag-card ${on ? 'sel' : ''}`} role="checkbox" aria-checked={on} tabIndex={0} onClick={() => toggle(h.tag)} onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && (e.preventDefault(), toggle(h.tag))}>
                            <div className="row between nowrap"><span className="tag-name">#{h.tag}</span><input type="checkbox" checked={on} readOnly tabIndex={-1} aria-hidden="true" /></div>
                            <div className="kv"><span>Popularity (est.)</span><Levels level={h.popularity} /></div>
                            <div className="kv"><span>Relevance</span><span className="row nowrap" style={{ gap: 8 }}><span style={{ width: 70 }}><Meter value={h.relevance} /></span><strong style={{ color: 'var(--navy)' }}>{h.relevance}</strong></span></div>
                            <div className="kv"><span>Competition</span><Badge tone={tone[h.competition]}>{h.competition}</Badge></div>
                            <div className="kv"><span>Trend direction</span><span>Not available (no live data)</span></div>
                            <div className="xs muted">{h.reason}</div>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )
              })}
              {sel.length > 0 && (
                <div className="sticky-bar">
                  <strong>{sel.length} selected</strong>
                  {sel.length > plat.maxHashtags && <span className="xs" style={{ color: '#ffd37a' }}>{plat.name} suits about {plat.hashtagRange}</span>}
                  <span className="grow" />
                  <Button size="sm" icon="copy" onClick={copySel}>Copy selected</Button>
                  <Button size="sm" variant="ghost" icon="save" onClick={saveSel}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => navigate('/app/builder')}>Use in post</Button>
                  <Button size="sm" variant="ghost" onClick={() => patch({ selectedTags: [] })} aria-label="Clear selection"><Icon name="close" size={14} /></Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
