import { useMemo } from 'react'
import { Badge, BarChart, Button, Card, Donut, Empty, Icon, Meter, PageHeader } from '../components/ui'
import { PLANS } from '../lib/plans'
import { PLATFORMS } from '../lib/platforms'
import { navigate } from '../lib/router'
import { useStore } from '../lib/store'
import { timeAgo } from '../lib/util'
import { useAuth } from '../lib/auth'
import type { ActivityKind } from '../types'

const KIND_LABEL: Record<ActivityKind, string> = { analysis: 'Photo analyses', hashtags: 'Hashtag runs', captions: 'Caption runs', tags: 'Tag searches', optimize: 'Optimizations', explore: 'Explorations', save: 'Saves', post: 'Posts saved' }
const KIND_ICON: Record<ActivityKind, string> = { analysis: 'scan', hashtags: 'hash', captions: 'caption', tags: 'at', optimize: 'spark', explore: 'trend', save: 'save', post: 'edit' }
const QUICK = [
  { label: 'Analyze a photo', icon: 'scan', to: '/app/analyzer' },
  { label: 'Generate hashtags', icon: 'hash', to: '/app/hashtags' },
  { label: 'Write captions', icon: 'caption', to: '/app/captions' },
  { label: 'Explore trends', icon: 'trend', to: '/app/trending' },
  { label: 'Build a post', icon: 'edit', to: '/app/builder' },
]

export default function Overview() {
  const { user } = useAuth()
  const { data } = useStore()
  const plan = PLANS[data.plan]
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const savedTags = data.saved.filter((s) => s.type === 'hashtag').length
  const favCaptions = data.saved.filter((s) => s.type === 'caption').slice(0, 3)

  const week = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (6 - i)); return d })
    return days.map((d) => ({ label: d.toLocaleDateString(undefined, { weekday: 'short' }), value: data.activity.filter((a) => new Date(a.at).toDateString() === d.toDateString()).length }))
  }, [data.activity])
  const platforms = useMemo(() => Object.values(PLATFORMS).map((p) => ({ label: p.name, color: p.color === '#000000' || p.color === '#111827' ? '#4b5563' : p.color, value: data.activity.filter((a) => a.platform === p.id).length })), [data.activity])
  const kinds = useMemo(() => (Object.keys(KIND_LABEL) as ActivityKind[]).map((k) => ({ k, n: data.activity.filter((a) => a.kind === k).length })).filter((x) => x.n > 0), [data.activity])
  const cats = useMemo(() => { const m = new Map<string, number>(); data.projects.forEach((p) => m.set(p.category, (m.get(p.category) ?? 0) + 1)); return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5) }, [data.projects])

  const stats = [
    { label: 'Images analyzed', value: data.imagesAnalyzed, icon: 'scan' },
    { label: 'Hashtags generated', value: data.hashtagsGenerated, icon: 'hash' },
    { label: 'Saved hashtags', value: savedTags, icon: 'save' },
    { label: 'Saved items', value: data.saved.length, icon: 'folder' },
  ]

  return (
    <>
      <PageHeader title={`${greet}, ${user?.name.split(' ')[0] ?? 'there'}`} subtitle="Here's your NEXORA activity. All numbers come from what you've done in the app." actions={<Button icon="upload" onClick={() => navigate('/app/analyzer')}>Upload photo</Button>} />
      <div className="grid-4">
        {stats.map((s) => <Card key={s.label} className="stat"><div className="label"><span className="icon"><Icon name={s.icon} size={16} /></span>{s.label}</div><div className="value">{s.value}</div></Card>)}
      </div>

      <h3 className="mt-lg">Quick actions</h3>
      <div className="grid-4 mt" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))' }}>
        {QUICK.map((q) => <button key={q.to} className="quick" onClick={() => navigate(q.to)}><span className="icon"><Icon name={q.icon} /></span>{q.label}</button>)}
      </div>

      <div className="grid-2 mt-lg">
        <Card>
          <div className="card-head"><h3>Activity, last 7 days</h3><Badge tone="gray">{week.reduce((a, b) => a + b.value, 0)} actions</Badge></div>
          <BarChart data={week} />
          <div className="bar-labels">{week.map((d, i) => <span key={i}>{d.label}</span>)}</div>
        </Card>
        <Card>
          <div className="card-head"><h3>Platform overview</h3><span className="xs muted">by your activity</span></div>
          {platforms.every((p) => p.value === 0) ? <Empty icon="spark" title="No platform activity yet">Generate something for a platform to see it here.</Empty> : (
            <div className="row nowrap" style={{ gap: 20, alignItems: 'center' }}>
              <Donut parts={platforms} />
              <div className="legend">{platforms.filter((p) => p.value > 0).map((p) => <div key={p.label} className="row between nowrap"><span><i style={{ background: p.color }} />{p.label}</span><strong>{p.value}</strong></div>)}</div>
            </div>
          )}
        </Card>
      </div>

      <div className="grid-2 mt-lg">
        <Card>
          <div className="card-head"><h3>Recent projects</h3></div>
          {data.projects.length === 0 ? <Empty icon="image" title="No projects yet">Analyze a photo and it will appear here.</Empty> : data.projects.slice(0, 5).map((p) => (
            <div key={p.id} className="list-item"><img className="thumb" src={p.thumb} alt="" /><div className="grow"><div className="bold small ellip">{p.title}</div><div className="xs muted ellip">{p.category} · {timeAgo(p.createdAt)}</div></div></div>
          ))}
        </Card>
        <Card>
          <div className="card-head"><h3>Favorite captions</h3><Button size="sm" variant="ghost" onClick={() => navigate('/app/saved')}>View all</Button></div>
          {favCaptions.length === 0 ? <Empty icon="caption" title="No saved captions">Save a caption to keep it here.</Empty> : favCaptions.map((c) => <div key={c.id} className="list-item"><div className="grow small" style={{ whiteSpace: 'pre-wrap', maxHeight: 64, overflow: 'hidden' }}>{c.content}</div></div>)}
        </Card>
      </div>

      <div className="grid-2 mt-lg">
        <Card>
          <div className="card-head"><h3>Recent activity</h3></div>
          {data.activity.length === 0 ? <Empty icon="spark" title="Nothing yet">Your actions show up here.</Empty> : data.activity.slice(0, 7).map((a) => (
            <div key={a.id} className="list-item"><span className="icon" style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--blue-soft)', color: 'var(--blue)', display: 'grid', placeItems: 'center', flex: 'none' }}><Icon name={KIND_ICON[a.kind]} size={15} /></span><div className="grow small ellip">{a.label}</div><span className="xs muted">{timeAgo(a.at)}</span></div>
          ))}
        </Card>
        <Card>
          <div className="card-head"><h3>Plan usage this month</h3><Badge tone={data.plan === 'pro' ? 'violet' : 'blue'}>{plan.name}</Badge></div>
          <div className="stack">
            <div><div className="row between small"><span>AI requests</span><strong>{data.usage.aiCalls}/{plan.aiCallsPerMonth}</strong></div><Meter value={(data.usage.aiCalls / plan.aiCallsPerMonth) * 100} /></div>
            <div><div className="row between small"><span>Photo analyses</span><strong>{data.usage.analyses}/{plan.analysesPerMonth}</strong></div><Meter value={(data.usage.analyses / plan.analysesPerMonth) * 100} /></div>
            <div><div className="row between small"><span>Saved items</span><strong>{data.saved.length}/{plan.savedItems}</strong></div><Meter value={(data.saved.length / plan.savedItems) * 100} /></div>
            {data.plan === 'free' && <Button variant="soft" onClick={() => navigate('/app/settings')}>See Pro</Button>}
          </div>
        </Card>
      </div>

      <div className="locked mt-lg">
        <Card>
          <div className="card-head"><h3>Advanced analytics</h3><Badge tone="violet">Pro</Badge></div>
          <div className="grid-2">
            <div><div className="bold small" style={{ marginBottom: 8 }}>What you use most</div>{kinds.length === 0 ? <span className="small muted">No activity yet.</span> : kinds.map(({ k, n }) => <div key={k} className="row between small" style={{ padding: '4px 0' }}><span>{KIND_LABEL[k]}</span><strong>{n}</strong></div>)}</div>
            <div><div className="bold small" style={{ marginBottom: 8 }}>Your content categories</div>{cats.length === 0 ? <span className="small muted">Analyze photos to see categories.</span> : cats.map(([c, n]) => <div key={c} className="row between small" style={{ padding: '4px 0' }}><span>{c}</span><strong>{n}</strong></div>)}</div>
          </div>
        </Card>
        {!plan.advancedAnalytics && (
          <div className="locked-cover"><Icon name="lock" size={22} /><strong>Advanced analytics is a Pro feature</strong><Button size="sm" onClick={() => navigate('/app/settings')}>Preview Pro</Button></div>
        )}
      </div>
    </>
  )
}
