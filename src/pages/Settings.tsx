import { useState } from 'react'
import { Badge, Button, Card, Field, Icon, Meter, Notice, PageHeader, useToast } from '../components/ui'
import { useAuth } from '../lib/auth'
import { PLANS } from '../lib/plans'
import { navigate } from '../lib/router'
import { useStore } from '../lib/store'
import { useWorkspace } from '../lib/workspace'
import { downloadText } from '../lib/util'

export default function Settings() {
  const { user, updateName, signOut, firebaseEnabled } = useAuth()
  const store = useStore()
  const { reset } = useWorkspace()
  const toast = useToast()
  const [name, setName] = useState(user?.name ?? '')
  const [saving, setSaving] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const d = store.data

  return (
    <>
      <PageHeader title="Settings" subtitle="Your profile, plan and data." />
      <div className="grid-2">
        <Card className="stack">
          <h3>Profile</h3>
          <div className="row"><div className="avatar" style={{ width: 52, height: 52, fontSize: 20 }}>{(user?.name ?? 'U').charAt(0).toUpperCase()}</div><div><div className="bold">{user?.name}</div><div className="small muted">{user?.email}</div></div><Badge tone={user?.mode === 'firebase' ? 'green' : 'amber'}>{user?.mode === 'firebase' ? 'Firebase account' : 'Demo mode'}</Badge></div>
          <Field label="Display name"><input type="text" value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <div className="row">
            <Button loading={saving} disabled={!name.trim() || name.trim() === user?.name} onClick={async () => { setSaving(true); try { await updateName(name); toast('Profile updated') } catch { toast('Could not update your name.', 'err') } finally { setSaving(false) } }}>Save profile</Button>
            <Button variant="ghost" icon="logout" onClick={async () => { await signOut(); reset(); navigate('/') }}>Log out</Button>
          </div>
          {!firebaseEnabled && <Notice tone="warn" icon="alert">Demo mode stores your account and data in this browser only. Add Firebase keys (see README) for Google Sign-In and cloud sync.</Notice>}
        </Card>

        <Card className="stack">
          <div className="card-head" style={{ marginBottom: 0 }}><h3>Usage this month</h3><Badge tone={d.plan === 'pro' ? 'violet' : 'blue'}>{PLANS[d.plan].name}</Badge></div>
          {([['AI requests', d.usage.aiCalls, PLANS[d.plan].aiCallsPerMonth], ['Photo analyses', d.usage.analyses, PLANS[d.plan].analysesPerMonth], ['Saved items', d.saved.length, PLANS[d.plan].savedItems]] as const).map(([l, v, m]) => (
            <div key={l}><div className="row between small"><span>{l}</span><strong>{v}/{m}</strong></div><Meter value={(v / m) * 100} tone="auto" /></div>
          ))}
          <span className="xs muted">AI usage resets at the start of each month.</span>
        </Card>
      </div>

      <h3 className="mt-lg">Plan</h3>
      <Notice icon="info"><strong>Payments are not connected yet.</strong> Switching plans here previews the Pro limits and features for testing. No charge is made.</Notice>
      <div className="grid-2 mt">
        {(['free', 'pro'] as const).map((id) => {
          const p = PLANS[id]
          const cur = d.plan === id
          return (
            <Card key={id} className="stack" style={cur ? { borderColor: 'var(--blue)', borderWidth: 2 } : undefined}>
              <div className="row between"><h3>{p.name}</h3>{cur && <Badge tone="green">Current</Badge>}</div>
              <div><span style={{ fontSize: 32, fontWeight: 800 }}>{p.price}</span><span className="muted"> / month</span></div>
              <ul className="plain-list small">{p.features.map((f) => <li key={f} className="row nowrap" style={{ alignItems: 'flex-start' }}><span style={{ color: 'var(--green)' }}><Icon name="check" size={15} /></span>{f}</li>)}</ul>
              <Button variant={cur ? 'ghost' : 'primary'} disabled={cur} onClick={() => { store.setPlan(id); toast(`Switched to ${p.name} (preview, no payment)`) }}>{cur ? 'Your current plan' : id === 'pro' ? 'Preview Pro' : 'Switch to Free'}</Button>
            </Card>
          )
        })}
      </div>

      <h3 className="mt-lg">Your data</h3>
      <Card className="stack mt">
        <p className="small muted">{user?.mode === 'firebase' ? 'Your data syncs to your private Firestore document and is cached in this browser.' : 'Your data is stored in this browser only.'}{store.syncing ? ' Syncing...' : ''}</p>
        <div className="row">
          <Button variant="ghost" icon="download" onClick={() => { downloadText('nexora-data.json', JSON.stringify({ ...d, projects: d.projects.map((p) => ({ ...p, thumb: undefined })) }, null, 2)); toast('Exported nexora-data.json') }}>Export my data</Button>
          {!confirmClear ? <Button variant="danger" icon="trash" onClick={() => setConfirmClear(true)}>Clear all data</Button> : (
            <>
              <span className="small">Delete everything?</span>
              <Button variant="danger" onClick={() => { store.clearAll(); setConfirmClear(false); toast('All data cleared') }}>Yes, clear</Button>
              <Button variant="ghost" onClick={() => setConfirmClear(false)}>Cancel</Button>
            </>
          )}
        </div>
      </Card>
    </>
  )
}
