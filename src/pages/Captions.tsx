import { useState } from 'react'
import { Badge, Button, Card, Empty, ErrorBox, Field, PageHeader, Spinner, useToast } from '../components/ui'
import { CopyButton, InputPanel } from '../components/Shared'
import { generateCaptions } from '../lib/ai'
import { composePost } from '../lib/compose'
import { CAPTION_STYLES, LANGUAGES, PLATFORMS } from '../lib/platforms'
import { PLANS } from '../lib/plans'
import { useStore } from '../lib/store'
import { useAction } from '../lib/useAction'
import { navigate } from '../lib/router'
import { hashify } from '../lib/util'
import { useWorkspace } from '../lib/workspace'
import type { Caption } from '../types'

export default function Captions() {
  const { ws, patch } = useWorkspace()
  const store = useStore()
  const toast = useToast()
  const { run, loading, error } = useAction()
  const [style, setStyle] = useState('Creative')
  const [language, setLanguage] = useState('English')
  const count = PLANS[store.data.plan].captionVariants
  const plat = PLATFORMS[ws.platform]
  const canGenerate = Boolean(ws.image || ws.context.trim() || ws.analysis)

  const generate = async () => {
    const r = await run('aiCalls', () => generateCaptions({ image: ws.image, context: ws.context, audience: ws.audience, platform: ws.platform, category: ws.analysis?.category, analysis: ws.analysis, style, language, count, hashtags: ws.selectedTags }))
    if (!r) return
    patch({ captions: r })
    store.log('captions', `Generated ${r.length} ${style} captions (${language})`, ws.platform)
  }
  const full = (c: Caption) => composePost(c.text, c.hashtags, [])
  const save = (c: Caption) => { const r = store.save({ type: 'caption', title: `${c.style} caption`, content: full(c), platform: ws.platform, note: language }); toast(r.message, r.ok ? 'ok' : 'err') }
  const use = (c: Caption) => { patch({ finalCaption: c.text, selectedTags: c.hashtags }); navigate('/app/builder') }

  return (
    <>
      <PageHeader title="Caption Generator" subtitle={`Platform-aware captions in 10 styles and 4 languages. ${plat.name}: ${plat.captionStyle}`} />
      <div className="split">
        <Card className="stack">
          <InputPanel compact />
          <div className="grid-2">
            <Field label="Writing style"><select value={style} onChange={(e) => setStyle(e.target.value)}>{CAPTION_STYLES.map((s) => <option key={s}>{s}</option>)}</select></Field>
            <Field label="Language"><select value={language} onChange={(e) => setLanguage(e.target.value)}>{LANGUAGES.map((s) => <option key={s}>{s}</option>)}</select></Field>
          </div>
          {ws.selectedTags.length > 0 && <span className="xs muted">Will draw on your {ws.selectedTags.length} selected hashtags.</span>}
          <Button size="lg" icon="caption" loading={loading} disabled={!canGenerate} onClick={generate}>Generate {count} captions</Button>
          {!canGenerate && <span className="xs muted">Upload a photo or add context first.</span>}
          {error && <ErrorBox message={error} onRetry={generate} />}
        </Card>
        <div className="stack">
          {loading && <Card><Spinner label="Writing captions..." /></Card>}
          {!loading && ws.captions.length === 0 && <Card><Empty icon="caption" title="No captions yet">Pick a style and language, then generate.</Empty></Card>}
          {!loading && ws.captions.map((c, i) => {
            const len = full(c).length
            const over = len > plat.charLimit
            return (
              <div key={i} className="caption-card fade-in">
                <div className="row between"><Badge tone="violet">{c.style}</Badge><span className={`xs ${over ? 'over-limit' : 'muted'}`}>{len}/{plat.charLimit} characters{over ? ' - too long for ' + plat.name : ''}</span></div>
                <div className="caption-text">{c.text}</div>
                {c.hashtags.length > 0 && <div className="mock-tags small">{c.hashtags.map(hashify).join(' ')}</div>}
                {c.keywords.length > 0 && <div className="chips">{c.keywords.map((k) => <span key={k} className="kw xs">{k}</span>)}</div>}
                <div className="row">
                  <CopyButton text={full(c)} />
                  <Button size="sm" variant="ghost" icon="save" onClick={() => save(c)}>Save</Button>
                  <Button size="sm" variant="ghost" icon="edit" onClick={() => use(c)}>Edit in Post Builder</Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
