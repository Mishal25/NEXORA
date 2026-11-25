import { useMemo, useState } from 'react'
import { Badge, Button, Card, Empty, Field, Icon, Meter, PageHeader, useToast } from '../components/ui'
import { CopyButton } from '../components/Shared'
import { PLANS } from '../lib/plans'
import { PLATFORMS } from '../lib/platforms'
import { useStore } from '../lib/store'
import { navigate } from '../lib/router'
import { timeAgo } from '../lib/util'
import type { PlatformId, SavedItem, SavedType } from '../types'

const TABS: { id: 'all' | SavedType; label: string }[] = [
  { id: 'all', label: 'All' }, { id: 'hashtag', label: 'Hashtags' }, { id: 'caption', label: 'Captions' },
  { id: 'tag', label: 'Tag ideas' }, { id: 'image', label: 'Images' }, { id: 'post', label: 'Posts' },
]

export default function Saved() {
  const store = useStore()
  const toast = useToast()
  const [tab, setTab] = useState<'all' | SavedType>('all')
  const [q, setQ] = useState('')
  const [plat, setPlat] = useState<'all' | PlatformId>('all')
  const [edit, setEdit] = useState<SavedItem | null>(null)
  const [draft, setDraft] = useState({ title: '', content: '', note: '' })
  const [del, setDel] = useState<SavedItem | null>(null)
  const plan = PLANS[store.data.plan]
  const all = store.data.saved

  const items = useMemo(() => all.filter((s) => (tab === 'all' || s.type === tab) && (plat === 'all' || s.platform === plat) && (!q || (s.title + ' ' + s.content + ' ' + (s.note ?? '')).toLowerCase().includes(q.toLowerCase()))), [all, tab, plat, q])
  const count = (t: 'all' | SavedType) => (t === 'all' ? all.length : all.filter((s) => s.type === t).length)
  const open = (s: SavedItem) => { setEdit(s); setDraft({ title: s.title, content: s.content, note: s.note ?? '' }) }

  return (
    <>
      <PageHeader title="Saved Collection" subtitle="Your favorite hashtags, captions, tag ideas, analyzed images and finished posts." />
      <Card className="row between" style={{ marginBottom: 18 }}>
        <div className="small"><strong>{all.length}</strong> of {plan.savedItems} saved items used ({plan.name} plan)</div>
        <div style={{ width: 200 }}><Meter value={(all.length / plan.savedItems) * 100} /></div>
      </Card>
      <div className="row" style={{ marginBottom: 14 }}>
        <div className="search grow" style={{ minWidth: 200 }}><Icon name="search" size={16} /><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search saved items" aria-label="Search saved items" /></div>
        <select style={{ width: 'auto' }} value={plat} onChange={(e) => setPlat(e.target.value as 'all' | PlatformId)} aria-label="Platform filter">
          <option value="all">All platforms</option>
          {Object.values(PLATFORMS).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div className="tabs" role="tablist" style={{ marginBottom: 18 }}>
        {TABS.map((t) => <button key={t.id} role="tab" aria-selected={tab === t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>{t.label} ({count(t.id)})</button>)}
      </div>

      {all.length === 0 && <Card><Empty icon="folder" title="Nothing saved yet">Save hashtags, captions and posts from the other tools and they'll show up here.<div className="mt"><Button onClick={() => navigate('/app/hashtags')}>Generate hashtags</Button></div></Empty></Card>}
      {all.length > 0 && items.length === 0 && <Card><Empty icon="search" title="No matches">Try a different search or filter.</Empty></Card>}
      <div className="stack">
        {items.map((s) => (
          <div key={s.id} className="caption-card fade-in">
            <div className="row between nowrap" style={{ alignItems: 'flex-start' }}>
              <div className="row nowrap grow" style={{ alignItems: 'flex-start' }}>
                {s.thumb && <img className="thumb" src={s.thumb} alt="" />}
                <div className="grow"><div className="bold">{s.title}</div><div className="row" style={{ marginTop: 4 }}><Badge tone="violet">{s.type}</Badge>{s.platform && <Badge tone="gray">{PLATFORMS[s.platform].name}</Badge>}<span className="xs muted">{timeAgo(s.createdAt)}</span></div></div>
              </div>
            </div>
            {s.type !== 'hashtag' && <div className="caption-text small">{s.content}</div>}
            {s.note && <div className="xs muted">Note: {s.note}</div>}
            <div className="row">
              <CopyButton text={s.content} />
              <Button size="sm" variant="ghost" icon="edit" onClick={() => open(s)}>Edit</Button>
              <Button size="sm" variant="danger" icon="trash" onClick={() => setDel(s)}>Delete</Button>
            </div>
          </div>
        ))}
      </div>

      {edit && (
        <div className="modal-wrap" role="dialog" aria-modal="true" aria-label="Edit saved item" onClick={() => setEdit(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit saved item</h3>
            <Field label="Title"><input type="text" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></Field>
            <Field label="Content"><textarea rows={6} value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} /></Field>
            <Field label="Note"><input type="text" value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} /></Field>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setEdit(null)}>Cancel</Button>
              <Button disabled={!draft.title.trim() || !draft.content.trim()} onClick={() => { store.updateSaved(edit.id, { title: draft.title.trim(), content: draft.content, note: draft.note }); setEdit(null); toast('Changes saved') }}>Save changes</Button>
            </div>
          </div>
        </div>
      )}
      {del && (
        <div className="modal-wrap" role="dialog" aria-modal="true" aria-label="Confirm delete" onClick={() => setDel(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete this item?</h3>
            <p className="muted small">"{del.title}" will be removed from your collection.</p>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setDel(null)}>Cancel</Button>
              <Button variant="danger" icon="trash" onClick={() => { store.removeSaved(del.id); setDel(null); toast('Deleted') }}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
