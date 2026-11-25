import { useState } from 'react'
import { Badge, Button, Card, ErrorBox, Field, Icon, Meter, Notice, PageHeader, Uploader, useToast } from '../components/ui'
import { CopyButton, PlatformPicker } from '../components/Shared'
import { generateCaptions, generateHashtags, optimizePost } from '../lib/ai'
import { composePost } from '../lib/compose'
import { CAPTION_STYLES, PLATFORMS } from '../lib/platforms'
import { PLANS } from '../lib/plans'
import { useStore } from '../lib/store'
import { useAction } from '../lib/useAction'
import { navigate } from '../lib/router'
import { downloadText, hashify } from '../lib/util'
import { useAuth } from '../lib/auth'
import { useWorkspace } from '../lib/workspace'
import type { OptimizeResult, PlatformId } from '../types'

const CRIT_LABEL: Record<string, string> = { caption: 'Caption quality', hashtags: 'Hashtag relevance', keywords: 'Keyword usage', tagging: 'Tagging relevance', platform: 'Platform compatibility', audience: 'Audience relevance', clarity: 'Content clarity' }

function Preview({ platform, image, caption, tags, accounts, name }: { platform: PlatformId; image?: string; caption: string; tags: string[]; accounts: string[]; name: string }) {
  const initial = (name || 'U').charAt(0).toUpperCase()
  const body = (
    <>
      {caption || <span className="muted">Your caption appears here...</span>}
      {accounts.length > 0 && <div>{accounts.join(' ')}</div>}
      {tags.length > 0 && <div className="mock-tags">{tags.map(hashify).join(' ')}</div>}
    </>
  )
  const img = image ? <img className="mock-img" src={image} alt="Post" /> : <div className="mock-ph">Photo preview</div>
  const head = (sub: string) => (
    <div className="mock-head"><div className="avatar">{initial}</div><div><div className="bold">{name}</div><div className="xs muted">{sub}</div></div></div>
  )
  switch (platform) {
    case 'instagram':
      return <div className="mock">{head('Preview')}{img}<div className="mock-actions"><span>♡</span><span>💬</span><span>➤</span></div><div className="mock-body"><strong>{name}</strong> {body}</div></div>
    case 'linkedin':
      return <div className="mock">{head('Your headline · now · 🌐')}<div className="mock-body">{body}</div>{img}<div className="mock-actions" style={{ paddingTop: 10 }}><span>👍 Like</span><span>💬 Comment</span><span>↻ Repost</span><span>➤ Send</span></div></div>
    case 'facebook':
      return <div className="mock">{head('Just now · 🌐')}<div className="mock-body">{body}</div>{img}<div className="mock-actions" style={{ paddingTop: 10 }}><span>👍 Like</span><span>💬 Comment</span><span>↪ Share</span></div></div>
    case 'x':
      return <div className="mock x">{head('now')}<div className="mock-body" style={{ paddingTop: 0 }}>{body}</div><div style={{ padding: '0 14px 12px' }}>{image ? <img className="mock-img" style={{ borderRadius: 14 }} src={image} alt="Post" /> : <div className="mock-ph" style={{ borderRadius: 14, height: 160 }}>Photo preview</div>}</div></div>
    case 'pinterest':
      return <div className="mock pinterest" style={{ maxWidth: 320 }}>{img}<div className="mock-body">{body}</div></div>
    case 'youtube':
      return <div className="mock">{image ? <img className="mock-img" style={{ aspectRatio: '16/9' }} src={image} alt="Thumbnail" /> : <div className="mock-ph">Thumbnail preview</div>}<div className="mock-body"><div className="bold" style={{ marginBottom: 6 }}>{caption.split('\n')[0] || 'Video title'}</div><div className="small">{body}</div></div></div>
    case 'threads':
      return <div className="mock">{head('now')}<div className="mock-body" style={{ paddingTop: 0 }}>{body}</div>{image && <div style={{ padding: '0 14px 12px' }}><img className="mock-img" style={{ borderRadius: 12 }} src={image} alt="Post" /></div>}<div className="mock-actions"><span>♡</span><span>💬</span><span>↻</span><span>➤</span></div></div>
  }
}

export default function Builder() {
  const { ws, patch, setImage } = useWorkspace()
  const store = useStore()
  const { user } = useAuth()
  const toast = useToast()
  const cap = useAction()
  const tagAct = useAction()
  const opt = useAction()
  const [style, setStyle] = useState('Creative')
  const [view, setView] = useState<PlatformId>(ws.platform)
  const [custom, setCustom] = useState('')
  const [result, setResult] = useState<OptimizeResult | null>(null)
  const plan = PLANS[store.data.plan]
  const plat = PLATFORMS[ws.platform]
  const text = composePost(ws.finalCaption, ws.selectedTags, ws.chosenAccounts)
  const over = text.length > plat.charLimit
  const hasContext = Boolean(ws.image || ws.context.trim() || ws.analysis)
  const base = { image: ws.image, context: ws.context, audience: ws.audience, platform: ws.platform, category: ws.analysis?.category, analysis: ws.analysis }

  const setPlatform = (p: PlatformId) => { patch({ platform: p }); setView(p) }
  const genCaptions = async () => {
    const r = await cap.run('aiCalls', () => generateCaptions({ ...base, style, language: 'English', count: plan.captionVariants, hashtags: ws.selectedTags }))
    if (r) { patch({ captions: r, finalCaption: ws.finalCaption || r[0]?.text || '' }); store.log('captions', `Generated ${r.length} ${style} captions`, ws.platform) }
  }
  const genTags = async () => {
    const r = await tagAct.run('aiCalls', () => generateHashtags(base))
    if (r) {
      const top = [...r.hashtags].sort((a, b) => b.relevance - a.relevance).slice(0, plat.maxHashtags).map((h) => h.tag)
      patch({ hashtags: r.hashtags, selectedTags: top })
      store.addHashtagsGenerated(r.hashtags.length)
      store.log('hashtags', `Generated ${r.hashtags.length} hashtags`, ws.platform)
      toast(`Picked the top ${top.length} for ${plat.name}. Edit as you like.`)
    }
  }
  const check = async () => {
    const r = await opt.run('aiCalls', () => optimizePost({ ...base, caption: ws.finalCaption, hashtags: ws.selectedTags, mentions: ws.chosenAccounts }))
    if (r) { setResult(r); store.log('optimize', 'Optimized a post', ws.platform) }
  }
  const addTag = () => {
    const t = custom.replace(/^#+/, '').replace(/[^\p{L}\p{N}_]/gu, '')
    if (t && !ws.selectedTags.includes(t)) patch({ selectedTags: [...ws.selectedTags, t] })
    setCustom('')
  }
  const score = result ? Math.round(result.criteria.reduce((a, c) => a + c.score, 0) / Math.max(1, result.criteria.length)) : 0
  const savePost = () => {
    const r = store.save({ type: 'post', title: `${plat.name} post`, content: text, platform: ws.platform, thumb: ws.image?.thumb })
    toast(r.message, r.ok ? 'ok' : 'err')
    if (r.ok) store.log('post', `Saved a ${plat.name} post`, ws.platform)
  }
  const download = () => {
    downloadText('nexora-post.txt', `PLATFORM: ${plat.name}\n\nCAPTION\n${ws.finalCaption}\n\nACCOUNTS TO TAG\n${ws.chosenAccounts.join(' ') || '(none)'}\n\nHASHTAGS\n${ws.selectedTags.map(hashify).join(' ') || '(none)'}\n\nFULL POST\n${text}\n`)
    toast('Downloaded nexora-post.txt')
  }

  return (
    <>
      <PageHeader title="Post Builder" subtitle="Build, edit and preview your post for each platform. NEXORA doesn't publish for you: copy or download, then post on the platform." />
      <div className="split">
        <div className="stack">
          <Card className="stack">
            <h3>1. Photo and platform</h3>
            <Uploader image={ws.image} onImage={setImage} compact />
            <PlatformPicker value={ws.platform} onChange={setPlatform} />
            <Field label="Context (optional)"><textarea rows={2} value={ws.context} onChange={(e) => patch({ context: e.target.value })} placeholder="What is this post about?" /></Field>
          </Card>
          <Card className="stack">
            <h3>2. Caption</h3>
            <div className="row nowrap"><select value={style} onChange={(e) => setStyle(e.target.value)} aria-label="Caption style">{CAPTION_STYLES.map((s) => <option key={s}>{s}</option>)}</select><Button icon="spark" loading={cap.loading} disabled={!hasContext} onClick={genCaptions}>Generate</Button></div>
            {!hasContext && <span className="xs muted">Add a photo or context to generate.</span>}
            {cap.error && <ErrorBox message={cap.error} onRetry={genCaptions} />}
            {ws.captions.length > 0 && (
              <div className="stack-sm">
                <span className="xs muted">Pick a starting point:</span>
                {ws.captions.map((c, i) => (
                  <div key={i} className="row nowrap" style={{ alignItems: 'flex-start' }}>
                    <div className="grow small ellip" style={{ whiteSpace: 'normal', maxHeight: 40, overflow: 'hidden' }}>{c.text}</div>
                    <Button size="sm" variant="soft" onClick={() => patch({ finalCaption: c.text, selectedTags: c.hashtags.length ? c.hashtags : ws.selectedTags })}>Use</Button>
                  </div>
                ))}
              </div>
            )}
            <Field label="Final caption (edit freely)"><textarea rows={6} value={ws.finalCaption} onChange={(e) => patch({ finalCaption: e.target.value })} placeholder="Write or generate your caption..." /></Field>
            <div className={`xs ${over ? 'over-limit' : 'muted'}`}>{text.length}/{plat.charLimit} characters for {plat.name}{over ? ' (over the limit)' : ''}</div>
          </Card>
          <Card className="stack">
            <div className="card-head" style={{ marginBottom: 0 }}><h3>3. Hashtags</h3><Button size="sm" icon="hash" loading={tagAct.loading} disabled={!hasContext} onClick={genTags}>Generate</Button></div>
            {tagAct.error && <ErrorBox message={tagAct.error} onRetry={genTags} />}
            <div className="chips">{ws.selectedTags.length === 0 && <span className="small muted">None selected. Generate, or add your own.</span>}{ws.selectedTags.map((t) => <button key={t} className="chip active" title="Remove" onClick={() => patch({ selectedTags: ws.selectedTags.filter((x) => x !== t) })}>#{t} ×</button>)}</div>
            <div className="row nowrap"><input type="text" value={custom} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTag()} placeholder="Add a hashtag" aria-label="Add a hashtag" /><Button variant="ghost" onClick={addTag}>Add</Button></div>
            <span className="xs muted">{plat.name} works best with {plat.hashtagRange}. <a href="#/app/hashtags">Browse all hashtags</a></span>
          </Card>
          <Card className="stack">
            <div className="card-head" style={{ marginBottom: 0 }}><h3>4. Tags</h3><Button size="sm" variant="ghost" onClick={() => navigate('/app/tags')}>Find accounts</Button></div>
            {ws.chosenAccounts.length === 0 && <span className="small muted">No accounts chosen. Nothing is tagged unless you add it.</span>}
            {ws.chosenAccounts.map((a, i) => (
              <div key={i} className="row nowrap">
                <input type="text" value={a} aria-label="Account to tag" onChange={(e) => patch({ chosenAccounts: ws.chosenAccounts.map((x, j) => (j === i ? e.target.value : x)) })} />
                {!a.startsWith('@') && <Badge tone="amber">Not in post until it's an @handle</Badge>}
                <Button size="sm" variant="ghost" aria-label="Remove tag" onClick={() => patch({ chosenAccounts: ws.chosenAccounts.filter((_, j) => j !== i) })}><Icon name="close" size={14} /></Button>
              </div>
            ))}
          </Card>
        </div>

        <div className="stack" style={{ position: 'sticky', top: 16 }}>
          <Card>
            <div className="tabs" role="tablist" aria-label="Preview platform">
              {Object.values(PLATFORMS).map((p) => <button key={p.id} role="tab" aria-selected={view === p.id} className={`tab ${view === p.id ? 'active' : ''}`} onClick={() => setView(p.id)}>{p.name}</button>)}
            </div>
            <div className="mt"><Preview platform={view} image={ws.image?.dataUrl} caption={ws.finalCaption} tags={ws.selectedTags} accounts={ws.chosenAccounts} name={user?.name ?? 'You'} /></div>
            {PLATFORMS[view].id !== ws.platform && <p className="xs muted center mt">Previewing {PLATFORMS[view].name}. Counts and tips follow your selected platform ({plat.name}).</p>}
            <div className="row mt" style={{ justifyContent: 'center' }}>
              <CopyButton text={text} label="Copy post" variant="primary" size="md" />
              <Button variant="ghost" icon="download" disabled={!text} onClick={download}>Download</Button>
              <Button variant="ghost" icon="save" disabled={!text} onClick={savePost}>Save post</Button>
            </div>
          </Card>

          <Card className="stack">
            <div className="card-head" style={{ marginBottom: 0 }}><h3>Post optimizer</h3><Button size="sm" icon="spark" loading={opt.loading} disabled={!ws.finalCaption.trim()} onClick={check}>Check post</Button></div>
            {!ws.finalCaption.trim() && <span className="small muted">Write a caption to check it.</span>}
            {opt.error && <ErrorBox message={opt.error} onRetry={check} />}
            {result && (
              <div className="stack fade-in">
                <div className="row"><div className="score-ring" style={{ ['--v' as string]: score }}><span>{score}</span></div><div className="grow"><div className="bold">Optimization score: {score}/100</div><div className="small muted">A guide to polish, not a prediction. NEXORA can't promise reach or engagement.</div></div></div>
                <div className="stack-sm">{result.criteria.map((c) => <div key={c.key}><div className="row between small"><span>{CRIT_LABEL[c.key] ?? c.key}</span><strong>{c.score}</strong></div><Meter value={c.score} tone="auto" /><div className="xs muted">{c.note}</div></div>)}</div>
                <div><div className="bold small" style={{ marginBottom: 6 }}>Suggestions</div>
                  <ul className="plain-list small">{result.suggestions.slice(0, plan.advancedOptimizer ? 10 : 3).map((s, i) => <li key={i} className="row nowrap" style={{ alignItems: 'flex-start' }}><Badge tone={s.priority === 'high' ? 'red' : s.priority === 'medium' ? 'amber' : 'gray'}>{s.priority}</Badge><span>{s.text}</span></li>)}</ul>
                  {!plan.advancedOptimizer && result.suggestions.length > 3 && <p className="xs muted mt">Pro shows all suggestions and an AI rewrite. <a href="#/app/settings">Upgrade</a></p>}
                </div>
                {plan.advancedOptimizer && result.improvedCaption && (
                  <div className="stack-sm"><div className="bold small">Suggested rewrite</div><div className="caption-text small">{result.improvedCaption}</div><Button size="sm" variant="soft" onClick={() => { patch({ finalCaption: result.improvedCaption }); toast('Rewrite applied') }}>Use this rewrite</Button></div>
                )}
              </div>
            )}
          </Card>
          <Notice icon="info">Direct publishing isn't connected. Each platform requires its own official API and your authorization.</Notice>
        </div>
      </div>
    </>
  )
}
