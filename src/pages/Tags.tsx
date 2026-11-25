import { useMemo, useState } from 'react'
import { Badge, Button, Card, Empty, ErrorBox, Field, Icon, Meter, Notice, PageHeader, Spinner, useToast } from '../components/ui'
import { PlatformPicker } from '../components/Shared'
import { suggestTags } from '../lib/ai'
import { PLATFORMS } from '../lib/platforms'
import { platformSearchProvider, verificationLabel } from '../lib/providers'
import { useStore } from '../lib/store'
import { useAction } from '../lib/useAction'
import { useWorkspace } from '../lib/workspace'
import { navigate } from '../lib/router'
import type { AccountType, PlatformId, TagSuggestion } from '../types'

const TYPES: ('all' | AccountType)[] = ['all', 'brand', 'company', 'organization', 'community', 'institution', 'page', 'creator']

export default function Tags() {
  const { ws, patch } = useWorkspace()
  const store = useStore()
  const toast = useToast()
  const { run, loading, error } = useAction()
  const [query, setQuery] = useState('')
  const [searchPlatform, setSearchPlatform] = useState<PlatformId>(ws.platform)
  const [results, setResults] = useState<TagSuggestion[]>([])
  const [type, setType] = useState<'all' | AccountType>('all')
  const [filterText, setFilterText] = useState('')
  const [handle, setHandle] = useState('')
  const [asked, setAsked] = useState(false)
  const chosen = ws.chosenAccounts

  const find = async () => {
    const r = await run('aiCalls', () => suggestTags({ image: ws.image, context: ws.context, audience: ws.audience, platform: ws.platform, category: ws.analysis?.category, analysis: ws.analysis, query }))
    if (!r) return
    setResults(r)
    setAsked(true)
    store.log('tags', `Found ${r.length} tag ideas`, ws.platform)
  }
  const shown = useMemo(() => results.filter((s) => (type === 'all' || s.type === type) && (!filterText || (s.name + s.reason).toLowerCase().includes(filterText.toLowerCase()))), [results, type, filterText])
  const toggle = (name: string) => patch({ chosenAccounts: chosen.includes(name) ? chosen.filter((c) => c !== name) : [...chosen, name] })
  const addHandle = () => {
    const h = handle.trim()
    if (!h) return
    const v = h.startsWith('@') ? h : '@' + h
    if (!chosen.includes(v)) patch({ chosenAccounts: [...chosen, v] })
    setHandle('')
    toast(`${v} added to your post`)
  }
  const saveTag = (s: TagSuggestion) => { const r = store.save({ type: 'tag', title: s.name, content: s.name, platform: s.platform, note: s.reason }); toast(r.message, r.ok ? 'ok' : 'err') }

  return (
    <>
      <PageHeader title="Smart Tag Finder" subtitle="Ideas for brands, communities and institutions worth tagging. You confirm every tag; NEXORA never tags anything on its own." />
      <Notice tone="warn" icon="alert">
        <strong>AI suggestions are not verified accounts.</strong> NEXORA does not invent usernames or profile links. Use the search buttons to find and verify the real profile on each platform, then add its exact @handle below.
      </Notice>
      <div className="split mt">
        <Card className="stack">
          <h3>Search</h3>
          <Field label="Search a name or topic"><input type="search" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && query.trim() && window.open(platformSearchProvider.searchLink(searchPlatform, query.trim()), '_blank', 'noopener')} placeholder="e.g. Google Developer Group, Surat" /></Field>
          <Field label="Platform"><PlatformPicker value={searchPlatform} onChange={setSearchPlatform} /></Field>
          <div className="row">
            <Button variant="soft" icon="link" disabled={!query.trim()} onClick={() => window.open(platformSearchProvider.searchLink(searchPlatform, query.trim()), '_blank', 'noopener')}>Search on {PLATFORMS[searchPlatform].name}</Button>
            <Button icon="spark" loading={loading} onClick={find}>Get AI ideas</Button>
          </div>
          <span className="xs muted">AI ideas use your photo analysis and context from the other tools{ws.analysis ? ` (${ws.analysis.category})` : ''}, plus your search text.</span>
          {error && <ErrorBox message={error} onRetry={find} />}
          <hr style={{ border: 0, borderTop: '1px solid var(--line)', width: '100%' }} />
          <h3>Add a handle you have verified</h3>
          <div className="row nowrap"><input type="text" value={handle} onChange={(e) => setHandle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addHandle()} placeholder="@username" aria-label="Verified handle" /><Button onClick={addHandle} icon="plus">Add</Button></div>
          <h3>Selected for your post ({chosen.length})</h3>
          {chosen.length === 0 ? <span className="small muted">Nothing selected yet.</span> : (
            <div className="chips">{chosen.map((c) => <button key={c} className="chip active" onClick={() => toggle(c)} title="Remove">{c} ×</button>)}</div>
          )}
          {chosen.length > 0 && <Button variant="soft" onClick={() => navigate('/app/builder')}>Continue to Post Builder</Button>}
        </Card>

        <div className="stack">
          {loading && <Card><Spinner label="Finding relevant accounts..." /></Card>}
          {!loading && !asked && <Card><Empty icon="at" title="No suggestions yet">Click Get AI ideas to see brands, communities and institutions that fit your post.</Empty></Card>}
          {!loading && asked && (
            <>
              <div className="row">
                <div className="search grow"><Icon name="search" size={16} /><input type="search" value={filterText} onChange={(e) => setFilterText(e.target.value)} placeholder="Filter suggestions" aria-label="Filter suggestions" /></div>
              </div>
              <div className="chips">{TYPES.map((t) => <button key={t} className={`chip ${type === t ? 'active' : ''}`} onClick={() => setType(t)}>{t === 'all' ? 'All types' : t}</button>)}</div>
              {shown.length === 0 && <Card><Empty icon="search" title="No suggestions match">Try clearing the filters.</Empty></Card>}
              {shown.map((s, i) => {
                const on = chosen.includes(s.name)
                return (
                  <div key={s.name + i} className="caption-card fade-in">
                    <div className="row between nowrap" style={{ alignItems: 'flex-start' }}>
                      <div className="grow"><div className="bold">{s.name}</div><div className="row" style={{ marginTop: 4 }}><Badge tone="violet">{s.type}</Badge><Badge tone="gray">{PLATFORMS[s.platform]?.name ?? s.platform}</Badge><Badge tone="amber">{verificationLabel(s)}</Badge></div></div>
                      <div style={{ width: 90 }}><div className="xs muted">Relevance {s.confidence}</div><Meter value={s.confidence} /></div>
                    </div>
                    <div className="small muted">{s.reason}</div>
                    <div className="row">
                      <Button size="sm" variant={on ? 'primary' : 'soft'} icon={on ? 'check' : 'plus'} onClick={() => toggle(s.name)}>{on ? 'Added to post' : 'Add to post'}</Button>
                      <a className="btn ghost sm" href={platformSearchProvider.searchLink(s.platform, s.name)} target="_blank" rel="noopener noreferrer"><Icon name="link" size={15} /> Find on {PLATFORMS[s.platform]?.name ?? 'platform'}</a>
                      <Button size="sm" variant="ghost" icon="save" onClick={() => saveTag(s)}>Save</Button>
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>
      </div>
    </>
  )
}
