import { useState } from 'react'
import { Icon, Logo, Meter, Spinner } from './ui'
import { useAuth } from '../lib/auth'
import { useStore } from '../lib/store'
import { PLANS } from '../lib/plans'
import { navigate } from '../lib/router'
import { useWorkspace } from '../lib/workspace'
import Overview from '../pages/Overview'
import Analyzer from '../pages/Analyzer'
import Hashtags from '../pages/Hashtags'
import Tags from '../pages/Tags'
import Captions from '../pages/Captions'
import Trending from '../pages/Trending'
import Builder from '../pages/Builder'
import Saved from '../pages/Saved'
import Settings from '../pages/Settings'

export const NAV = [
  { path: '/app', label: 'Overview', icon: 'home' },
  { path: '/app/analyzer', label: 'AI Photo Analyzer', icon: 'scan' },
  { path: '/app/hashtags', label: 'Hashtag Generator', icon: 'hash' },
  { path: '/app/tags', label: 'Smart Tag Finder', icon: 'at' },
  { path: '/app/captions', label: 'Caption Generator', icon: 'caption' },
  { path: '/app/trending', label: 'Trending Explorer', icon: 'trend' },
  { path: '/app/builder', label: 'Post Builder', icon: 'edit' },
  { path: '/app/saved', label: 'Saved Collection', icon: 'folder' },
  { path: '/app/settings', label: 'Settings', icon: 'settings' },
]

function Page({ route }: { route: string }) {
  switch (route.replace(/\/$/, '')) {
    case '/app/analyzer': return <Analyzer />
    case '/app/hashtags': return <Hashtags />
    case '/app/tags': return <Tags />
    case '/app/captions': return <Captions />
    case '/app/trending': return <Trending />
    case '/app/builder': return <Builder />
    case '/app/saved': return <Saved />
    case '/app/settings': return <Settings />
    default: return <Overview />
  }
}

export function Shell({ route }: { route: string }) {
  const { user, signOut } = useAuth()
  const { data, ready } = useStore()
  const { reset } = useWorkspace()
  const [open, setOpen] = useState(false)
  const plan = PLANS[data.plan]
  const active = route.replace(/\/$/, '') || '/app'
  const go = (p: string) => { setOpen(false); navigate(p) }

  return (
    <div className="shell">
      <div className={`scrim ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Main navigation">
        <div className="row between nowrap">
          <a href="#/" aria-label="NEXORA home"><Logo /></a>
        </div>
        <nav className="nav">
          {NAV.map((n) => (
            <a key={n.path} href={`#${n.path}`} className={active === n.path ? 'active' : ''} onClick={() => setOpen(false)}>
              <Icon name={n.icon} /> {n.label}
            </a>
          ))}
        </nav>
        <div className="side-foot">
          <div className="usage-mini">
            <div className="row between"><strong style={{ color: 'var(--navy)' }}>{plan.name} plan</strong><span>{data.usage.aiCalls}/{plan.aiCallsPerMonth} AI requests</span></div>
            <Meter value={(data.usage.aiCalls / plan.aiCallsPerMonth) * 100} />
            {data.plan === 'free' && <a href="#/app/settings">Upgrade to Pro</a>}
          </div>
          <div className="row nowrap">
            <div className="avatar">{(user?.name ?? 'U').charAt(0).toUpperCase()}</div>
            <div className="grow">
              <div className="bold small ellip">{user?.name}</div>
              <div className="xs muted ellip">{user?.mode === 'demo' ? 'Demo mode' : user?.email}</div>
            </div>
            <button className="btn ghost sm" aria-label="Log out" title="Log out" onClick={async () => { await signOut(); reset(); go('/') }}>
              <Icon name="logout" size={15} />
            </button>
          </div>
        </div>
      </aside>
      <div style={{ minWidth: 0 }}>
        <div className="topbar">
          <button className="btn ghost sm" aria-label="Open menu" onClick={() => setOpen(true)}><Icon name="menu" /></button>
          <Logo size={26} />
          <span style={{ width: 38 }} />
        </div>
        <main className="main fade-in" key={active}>
          {ready ? <Page route={route} /> : <Spinner label="Syncing your data..." />}
        </main>
      </div>
    </div>
  )
}
