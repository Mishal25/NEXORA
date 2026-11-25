import { Badge, Button, Card, ErrorBox, Meter, Notice, PageHeader, Spinner, Uploader, Field, Icon, useToast } from '../components/ui'
import { PlatformPicker, CopyButton } from '../components/Shared'
import { analyzeImage } from '../lib/ai'
import { PLATFORMS } from '../lib/platforms'
import { useStore } from '../lib/store'
import { useAction } from '../lib/useAction'
import { navigate } from '../lib/router'
import { useWorkspace } from '../lib/workspace'

export default function Analyzer() {
  const { ws, patch, setImage } = useWorkspace()
  const store = useStore()
  const toast = useToast()
  const { run, loading, error } = useAction()
  const a = ws.analysis

  const analyze = async () => {
    if (!ws.image) return
    const image = ws.image
    const res = await run('analyses', () => analyzeImage({ image, context: ws.context, audience: ws.audience, platform: ws.platform }))
    if (!res) return
    patch({ analysis: res, audience: ws.audience || res.audience.slice(0, 2).join(', ') })
    store.addProject({ title: res.mainSubject || 'Untitled photo', thumb: image.thumb, category: res.category, description: res.description, keywords: res.keywords })
    store.log('analysis', `Analyzed photo: ${res.mainSubject || res.category}`, ws.platform)
  }

  const saveImage = () => {
    if (!a || !ws.image) return
    const r = store.save({ type: 'image', title: a.mainSubject || 'Analyzed photo', content: a.description, thumb: ws.image.thumb, note: a.category })
    toast(r.message, r.ok ? 'ok' : 'err')
  }

  return (
    <>
      <PageHeader title="AI Photo Analyzer" subtitle="Upload a photo and Gemini will describe what is actually visible, then suggest the best category, audience and platforms." />
      <div className="split">
        <Card className="stack">
          <Uploader image={ws.image} onImage={setImage} />
          <Field label="Extra context (optional)" hint="Tell NEXORA what the photo is for. It won't guess places, people or brands on its own.">
            <textarea value={ws.context} onChange={(e) => patch({ context: e.target.value })} placeholder="e.g. Team photo from our hackathon in Ahmedabad" rows={3} />
          </Field>
          <Field label="Target audience (optional)"><input type="text" value={ws.audience} onChange={(e) => patch({ audience: e.target.value })} placeholder="e.g. developers, students" /></Field>
          <Field label="Primary platform"><PlatformPicker value={ws.platform} onChange={(platform) => patch({ platform })} /></Field>
          <Button size="lg" icon="spark" loading={loading} disabled={!ws.image} onClick={analyze}>{a ? 'Re-analyze image' : 'Analyze image'}</Button>
          {!ws.image && <span className="xs muted">Upload a photo to enable analysis.</span>}
          {error && <ErrorBox message={error} onRetry={ws.image ? analyze : undefined} />}
        </Card>

        <div className="stack">
          {loading && <Card><Spinner label="Gemini is looking at your photo..." /><div className="stack-sm"><div className="shimmer" /><div className="shimmer" style={{ width: '80%' }} /><div className="shimmer" style={{ width: '60%' }} /></div></Card>}
          {!loading && !a && (
            <Card><div className="empty"><div className="empty-icon"><Icon name="scan" size={22} /></div><strong>Your analysis will appear here</strong><p>Upload a JPG, PNG or WEBP photo and click Analyze image.</p></div></Card>
          )}
          {!loading && a && (
            <div className="stack fade-in">
              <Card>
                <div className="card-head"><h3>Image description</h3><div className="row"><Badge tone="violet">{a.category}</Badge></div></div>
                <p>{a.description}</p>
                <div className="grid-2 mt">
                  <div><div className="xs muted">Main subject</div><div className="bold">{a.mainSubject}</div></div>
                  <div><div className="xs muted">Setting and mood</div><div className="bold">{[a.setting, a.mood].filter(Boolean).join(' · ') || 'Not clear'}</div></div>
                </div>
                {a.objects.length > 0 && <div className="mt"><div className="xs muted" style={{ marginBottom: 6 }}>Detected</div><div className="chips">{a.objects.map((o) => <span key={o} className="kw">{o}</span>)}</div></div>}
              </Card>
              {a.uncertainties.length > 0 && <Notice tone="warn" icon="alert"><strong>Not confirmed from the photo:</strong> {a.uncertainties.join('; ')}. Add it in the context box if it applies.</Notice>}
              <Card>
                <div className="card-head"><h3>Suggested audience</h3></div>
                <div className="chips">{a.audience.map((x) => <Badge key={x} tone="blue">{x}</Badge>)}</div>
              </Card>
              <Card>
                <div className="card-head"><h3>Relevant keywords</h3><CopyButton text={a.keywords.join(', ')} label="Copy all" /></div>
                <div className="chips">{a.keywords.map((k) => <span key={k} className="kw">{k}</span>)}</div>
              </Card>
              <Card>
                <div className="card-head"><h3>Recommended platforms</h3><span className="xs muted">AI-estimated fit</span></div>
                <div className="stack-sm">
                  {a.platforms.map((p) => (
                    <div key={p.platform} className="row nowrap" style={{ alignItems: 'flex-start' }}>
                      <div style={{ width: 110 }} className="bold small">{PLATFORMS[p.platform]?.name ?? p.platform}</div>
                      <div className="grow"><Meter value={p.fit} /><div className="xs muted" style={{ marginTop: 4 }}>{p.reason}</div></div>
                      <strong className="small" style={{ width: 28 }}>{p.fit}</strong>
                    </div>
                  ))}
                </div>
              </Card>
              <Card>
                <div className="card-head"><h3>Next steps</h3></div>
                <div className="row">
                  <Button onClick={() => navigate('/app/hashtags')} icon="hash">Generate hashtags</Button>
                  <Button variant="soft" onClick={() => navigate('/app/captions')} icon="caption">Write captions</Button>
                  <Button variant="soft" onClick={() => navigate('/app/tags')} icon="at">Find tags</Button>
                  <Button variant="ghost" onClick={saveImage} icon="save">Save analysis</Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
