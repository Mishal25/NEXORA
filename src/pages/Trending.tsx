import { useMemo, useState } from 'react'
import { Badge, Button, Card, Empty, ErrorBox, Field, Icon, Meter, Notice, PageHeader, Spinner, useToast } from '../components/ui'
import { Levels, PlatformPicker } from '../components/Shared'
import { CATEGORIES } from '../lib/platforms'
import { activeTrendProvider, TREND_PROVIDERS } from '../lib/providers'
import { useStore } from '../lib/store'
import { useAction } from '../lib/useAction'
import { hashify } from '../lib/util'
import { useWorkspace } from '../lib/workspace'
import type { PlatformId, TrendHashtag, TrendResult } from '../types'

const tone = { low: 'green', medium: 'amber', high: 'red' } as const

export default function Trending() {
  const { ws } = useWorkspace()
  const store = useStore()
  const toast = useToast()
  const { run, loading, error } = useAction()
  const provider = activeTrendProvider()
  const [query, setQuery] = useState('')
  const [platform, setPlatform] = useState<PlatformId>(ws.platform)
  const [category, setCategory] = useState('Technology')
  const [result, setResult] = useState<TrendResult | null>(null)
  const [compare, setCompare] = useState<string[]>([])
  const [favOnly, setFavOnly] = useState(false)

  const explore = async (q = query) => {
    const r = await run('aiCalls', () => provider.explore({ query: q, platform, category }))
    if (!r) return
    setResult(r)
    setCompare([])
    store.log('explore', `Explored ${q ? '"' + q + '" in ' : ''}${category}`, platform)
  }
  const isFav = (t: string) => store.isSaved('hashtag', hashify(t))
  const fav = (h: TrendHashtag) => {
    if (isFav(h.tag)) {
      const item = store.data.saved.find((s) => s.type === 'hashtag' && s.content === hashify(h.tag))
      if (item) { store.removeSaved(item.id); toast('Removed from favorites') }
      return
    }
    const r = store.save({ type: 'hashtag', title: hashify(h.tag), content: hashify(h.tag), platform, note: category })
    toast(r.message, r.ok ? 'ok' : 'err')
  }
  const toggleCmp = (t: string) => setCompare((c) => (c.includes(t) ? c.filter((x) => x !== t) : c.length >= 3 ? (toast('Compare up to 3 hashtags', 'err'), c) : [...c, t]))
  const list = useMemo(() => (result?.hashtags ?? []).filter((h) => !favOnly || isFav(h.tag)), [result, favOnly, store.data.saved]) // eslint-disable-line react-hooks/exhaustive-deps
  const cmp = (result?.hashtags ?? []).filter((h) => compare.includes(h.tag))
  const dirLabel = { rising: 'Rising (est.)', steady: 'Steady (est.)', unknown: 'Unknown' } as const

  return (
    <>
      <PageHeader title="Trending Explorer" subtitle="Discover topics and hashtags by platform and category, compare them, and save favorites." />
      <Notice tone={provider.live ? 'info' : 'warn'} icon="info">
        <strong>Data source: {provider.label}.</strong>{' '}
        {provider.live ? '' : 'These are model estimates, not live platform statistics, and no post counts are shown. '}
        {result ? `Last updated ${new Date(result.source.generatedAt).toLocaleString()}.` : 'Run a search to see the last-updated time.'}
        <details style={{ marginTop: 6 }}>
          <summary className="small" style={{ cursor: 'pointer' }}>Data providers</summary>
          <ul className="plain-list small" style={{ marginTop: 8 }}>
            {TREND_PROVIDERS.map((p) => <li key={p.id}><strong>{p.label}</strong>: {p.configured ? 'active' : 'not connected'}{p.setupHint ? `. ${p.setupHint}` : ''}</li>)}
          </ul>
        </details>
      </Notice>

      <Card className="mt stack">
        <div className="grid-2">
          <Field label="Search hashtags or topics"><div className="search"><Icon name="search" size={16} /><input type="search" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && explore()} placeholder="e.g. street photography" /></div></Field>
          <Field label="Platform"><PlatformPicker value={platform} onChange={setPlatform} /></Field>
        </div>
        <Field label="Category"><div className="chips">{CATEGORIES.map((c) => <button key={c} className={`chip ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>{c}</button>)}</div></Field>
        <div className="row"><Button icon="trend" loading={loading} onClick={() => explore()}>Explore</Button>{result && <Button variant="ghost" icon="star" onClick={() => setFavOnly((f) => !f)}>{favOnly ? 'Showing favorites' : 'Favorites only'}</Button>}</div>
        {error && <ErrorBox message={error} onRetry={() => explore()} />}
      </Card>

      {loading && <Card className="mt"><Spinner label="Exploring..." /></Card>}
      {!loading && !result && <Card className="mt"><Empty icon="trend" title="Pick a category and explore">Results are labelled with their source and time.</Empty></Card>}
      {!loading && result && (
        <div className="fade-in">
          <h3 className="mt-lg">Topics to consider</h3>
          <div className="grid-3 mt">
            {result.topics.map((t) => (
              <Card key={t.title} className="stack-sm"><div className="bold">{t.title}</div><div className="small muted">{t.summary}</div>
                <div className="chips">{t.relatedHashtags.map((h) => <button key={h} className="chip" onClick={() => { setQuery(h); void explore(h) }}>{hashify(h)}</button>)}</div></Card>
            ))}
          </div>

          {cmp.length >= 2 && (
            <Card className="mt-lg" style={{ overflowX: 'auto' }}>
              <div className="card-head"><h3>Comparing {cmp.length} hashtags</h3><Button size="sm" variant="ghost" onClick={() => setCompare([])}>Clear</Button></div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 420 }}>
                <thead><tr><th style={{ textAlign: 'left', padding: 8 }} />{cmp.map((h) => <th key={h.tag} style={{ textAlign: 'left', padding: 8 }}>#{h.tag}</th>)}</tr></thead>
                <tbody>
                  {([['Popularity (est.)', (h: TrendHashtag) => <Levels level={h.popularity} />], ['Competition', (h: TrendHashtag) => <Badge tone={tone[h.competition]}>{h.competition}</Badge>], ['Relevance', (h: TrendHashtag) => <strong>{h.relevance}</strong>], ['Direction', (h: TrendHashtag) => dirLabel[h.direction] ?? 'Unknown']] as const).map(([l, fn]) => (
                    <tr key={l} style={{ borderTop: '1px solid var(--line)' }}><td style={{ padding: 8 }} className="muted">{l}</td>{cmp.map((h) => <td key={h.tag} style={{ padding: 8 }}>{fn(h)}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          <div className="row between mt-lg"><h3>Hashtags</h3><span className="small muted">Tick up to 3 to compare</span></div>
          {list.length === 0 && <Empty icon="star" title="No favorites in these results">Star a hashtag to save it.</Empty>}
          <div className="tag-grid mt">
            {list.map((h) => (
              <div key={h.tag} className={`tag-card ${compare.includes(h.tag) ? 'sel' : ''}`} style={{ cursor: 'default' }}>
                <div className="row between nowrap">
                  <span className="tag-name">#{h.tag}</span>
                  <span className="row nowrap" style={{ gap: 8 }}>
                    <button className="btn ghost sm" aria-label={isFav(h.tag) ? 'Remove favorite' : 'Save favorite'} aria-pressed={isFav(h.tag)} onClick={() => fav(h)} style={{ color: isFav(h.tag) ? 'var(--amber)' : undefined }}><Icon name="star" size={15} /></button>
                    <label className="row nowrap xs" style={{ gap: 6, cursor: 'pointer' }}><input type="checkbox" checked={compare.includes(h.tag)} onChange={() => toggleCmp(h.tag)} />Compare</label>
                  </span>
                </div>
                <div className="kv"><span>Popularity (est.)</span><Levels level={h.popularity} /></div>
                <div className="kv"><span>Relevance</span><span className="row nowrap" style={{ gap: 8 }}><span style={{ width: 70 }}><Meter value={h.relevance} /></span><strong style={{ color: 'var(--navy)' }}>{h.relevance}</strong></span></div>
                <div className="kv"><span>Competition</span><Badge tone={tone[h.competition]}>{h.competition}</Badge></div>
                <div className="kv"><span>Direction</span><span>{dirLabel[h.direction] ?? 'Unknown'}</span></div>
                <div className="xs muted">{h.reason}</div>
                {h.related.length > 0 && <div><div className="xs muted" style={{ marginBottom: 4 }}>Related</div><div className="chips">{h.related.map((r) => <button key={r} className="chip xs" onClick={() => { setQuery(r); void explore(r) }}>{hashify(r)}</button>)}</div></div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
