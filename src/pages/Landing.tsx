import { useRef, useState } from 'react'
import { Badge, Button, Card, Icon, Logo, Meter, useToast } from '../components/ui'
import { useAuth } from '../lib/auth'
import { PLANS } from '../lib/plans'
import { PLATFORM_LIST } from '../lib/platforms'
import { navigate, scrollToId } from '../lib/router'
import { prepareImage } from '../lib/util'
import { useWorkspace } from '../lib/workspace'

const FEATURES = [
  { icon: 'scan', title: 'AI Photo Analyzer', text: 'Gemini reads your actual photo: subject, setting, mood, category and keywords. It says so when it is unsure instead of guessing.' },
  { icon: 'hash', title: 'Hashtag Generator', text: 'Seven groups of hashtags with relevance, competition and reasons, clearly labelled as AI-estimated unless live data is connected.' },
  { icon: 'at', title: 'Smart Tag Finder', text: 'Ideas for brands, communities and institutions to tag. Nothing is invented or auto-tagged; you confirm every mention.' },
  { icon: 'caption', title: 'Caption Generator', text: '10 writing styles in English, Hindi, Gujarati and Hinglish, formatted for each platform.' },
  { icon: 'spark', title: 'Post Optimizer', text: 'A 100-point audit of caption, hashtags, keywords and clarity with concrete fixes. No promises of virality.' },
  { icon: 'trend', title: 'Trending Explorer', text: 'Search topics and hashtags by platform and category, compare, and save favourites with the data source always shown.' },
]
const STEPS = [
  { t: 'Upload', d: 'Drop in a JPG, PNG or WEBP and add optional context about the post.' },
  { t: 'Analyze', d: 'NEXORA understands the photo and picks the best category and platforms.' },
  { t: 'Generate', d: 'Get hashtags, captions and tag ideas tuned to your platform and audience.' },
  { t: 'Polish & copy', d: 'Edit in the Post Builder, preview per platform, then copy or download.' },
]
const FAQ = [
  ['Does NEXORA show live trending data?', 'Not unless a live provider is connected. By default, trend and popularity labels are AI estimates and are marked that way everywhere. The provider layer is built so an official API or authorized data vendor can be plugged in.'],
  ['Does it post to my accounts?', 'No. NEXORA helps you create the post; you copy or download it and publish on the platform yourself. Direct publishing would require each platform\'s official API and your authorization.'],
  ['Will it tag accounts automatically?', 'Never. Tag suggestions are AI ideas, not verified profiles, and nothing is added to a post until you choose it.'],
  ['Is my API key safe?', 'The Gemini key lives only in a server-side environment variable. The browser talks to NEXORA\'s own /api/ai endpoint.'],
  ['Which languages are supported for captions?', 'English, Hindi, Gujarati and Hinglish.'],
  ['How do Free and Pro differ?', 'Pro has higher AI limits, 5 caption variations, advanced post optimization with a rewrite, bigger saved collections and advanced analytics. Payments are not connected in this version.'],
]

const SAMPLE = {
  tags: [['#CoffeeShopVibes', 'Niche', 92], ['#SlowMornings', 'Community', 86], ['#LatteArt', 'Popular', 81], ['#CafeHopping', 'Trending (est.)', 77]],
  caption: 'Slow mornings, strong coffee, and nowhere to be. ☕✨ What\'s your go-to order?',
}

export default function Landing() {
  const { user } = useAuth()
  const { setImage } = useWorkspace()
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [menu, setMenu] = useState(false)
  const [tab, setTab] = useState<'tags' | 'caption' | 'score'>('tags')
  const [shot, setShot] = useState<string>('')

  const toApp = () => navigate(user ? '/app' : '/signup')
  const onFile = async (f?: File) => {
    if (!f) return
    try {
      const img = await prepareImage(f)
      setImage(img)
      setShot(img.dataUrl)
      try { sessionStorage.setItem('nexora.next', '/app/analyzer') } catch { /* ignore */ }
      toast('Photo ready. Taking you to the analyzer...')
      navigate(user ? '/app/analyzer' : '/signup')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not load this image.', 'err')
    }
  }
  const jump = (id: string) => { setMenu(false); scrollToId(id) }

  return (
    <div>
      <input ref={fileRef} type="file" hidden accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = '' }} />
      <header className="lnav">
        <div className="container lnav-in">
          <a href="#/" aria-label="NEXORA home"><Logo /></a>
          <nav className={`lnav-links ${menu ? 'open' : ''}`} aria-label="Sections">
            <button onClick={() => jump('features')}>Features</button>
            <button onClick={() => jump('how')}>How it works</button>
            <button onClick={() => jump('platforms')}>Platforms</button>
            <button onClick={() => jump('pricing')}>Pricing</button>
            <button onClick={() => jump('faq')}>FAQ</button>
          </nav>
          <div className="lnav-cta">
            {user ? (
              <Button size="sm" onClick={() => navigate('/app')}>Open dashboard</Button>
            ) : (
              <>
                <Button size="sm" variant="ghost" onClick={() => navigate('/login')}>Log in</Button>
                <Button size="sm" onClick={() => navigate('/signup')}>Get started</Button>
              </>
            )}
            <button className="btn ghost sm burger" aria-label="Toggle menu" onClick={() => setMenu((m) => !m)}><Icon name={menu ? 'close' : 'menu'} /></button>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="container hero-grid">
          <div className="fade-in">
            <span className="pill"><Icon name="spark" size={14} /> Create Smarter. Connect Better.</span>
            <h1>Your Social Media Deserves <span className="gradient-text">Smarter AI.</span></h1>
            <p className="lead">NEXORA looks at your photo and builds the hashtags, captions, tag ideas and posting guidance that fit it, for Instagram, LinkedIn, Facebook, X, Pinterest, YouTube and Threads.</p>
            <div className="hero-cta">
              <Button size="lg" icon="upload" onClick={() => fileRef.current?.click()}>Upload Photo</Button>
              <Button size="lg" variant="ghost" onClick={() => jump('features')}>Explore Features</Button>
            </div>
            <div className="trust"><span>Free plan available</span><span>Honest AI labels</span><span>You approve every tag</span></div>
          </div>

          <div className="showcase fade-in" aria-label="Interactive product preview">
            <div className="sc-top"><i /><i /><i /><span className="xs muted" style={{ marginLeft: 'auto' }}>Sample preview</span></div>
            <div className="sc-photo">{shot ? <img src={shot} alt="Your uploaded photo" /> : 'Your photo appears here'}</div>
            <div className="tabs" role="tablist" style={{ marginBottom: 14 }}>
              {([['tags', 'Hashtags'], ['caption', 'Caption'], ['score', 'Post score']] as const).map(([k, l]) => (
                <button key={k} role="tab" aria-selected={tab === k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</button>
              ))}
            </div>
            {tab === 'tags' && (
              <div className="stack-sm">
                {SAMPLE.tags.map(([t, g, s]) => (
                  <div key={t as string} className="row between nowrap">
                    <span className="bold">{t}</span>
                    <span className="row nowrap" style={{ gap: 8 }}><Badge tone="gray">{g}</Badge><span className="xs muted" style={{ width: 28 }}>{s}</span></span>
                  </div>
                ))}
              </div>
            )}
            {tab === 'caption' && <div className="caption-text small">{SAMPLE.caption}<div className="mock-tags mt xs">#CoffeeShopVibes #SlowMornings #LatteArt</div></div>}
            {tab === 'score' && (
              <div className="stack-sm">
                {[['Caption quality', 84], ['Hashtag relevance', 90], ['Clarity', 78]].map(([l, v]) => (
                  <div key={l as string}><div className="row between small"><span>{l}</span><strong>{v}</strong></div><Meter value={v as number} /></div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section" id="features">
        <div className="container">
          <div className="section-head"><h2>Everything you need to post with confidence</h2><p>One workspace from photo to publish-ready post.</p></div>
          <div className="grid-3">
            {FEATURES.map((f) => (
              <Card key={f.title} className="feature"><div className="icon"><Icon name={f.icon} size={22} /></div><h3>{f.title}</h3><p>{f.text}</p></Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section alt" id="how">
        <div className="container">
          <div className="section-head"><h2>How it works</h2><p>From a single photo to a polished post in four steps.</p></div>
          <div className="grid-4">
            {STEPS.map((s, i) => (
              <Card key={s.t} className="stack-sm"><div className="step-no">{i + 1}</div><h3>{s.t}</h3><p className="muted small">{s.d}</p></Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="platforms">
        <div className="container">
          <div className="section-head"><h2>Built for every platform</h2><p>Each platform gets its own hashtag counts, caption style and rules.</p></div>
          <div className="plat-row">{PLATFORM_LIST.map((p) => <div key={p.id} className="plat"><i style={{ background: p.color }} />{p.name}<span className="xs muted">{p.hashtagRange} tags</span></div>)}</div>
        </div>
      </section>

      <section className="section alt" id="pricing">
        <div className="container">
          <div className="section-head"><h2>Simple pricing</h2><p>Start free. Upgrade when you need more. Payments are not connected in this version.</p></div>
          <div className="grid-2" style={{ maxWidth: 820, margin: '0 auto' }}>
            {(['free', 'pro'] as const).map((id) => {
              const p = PLANS[id]
              return (
                <Card key={id} className={`price ${id}`}>
                  <div className="row between"><h3>{p.name}</h3>{id === 'pro' && <Badge tone="violet">Most popular</Badge>}</div>
                  <div><span className="amt">{p.price}</span><span className="muted"> / month</span></div>
                  <ul>{p.features.map((f) => <li key={f}><Icon name="check" size={16} />{f}</li>)}</ul>
                  <Button variant={id === 'pro' ? 'primary' : 'ghost'} onClick={() => navigate(user ? '/app/settings' : '/signup')}>{id === 'pro' ? 'Get Pro' : 'Start free'}</Button>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      <section className="section" id="faq">
        <div className="container">
          <div className="section-head"><h2>Questions, answered</h2></div>
          <div className="faq">{FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="cta-band">
            <h2>Ready to post smarter?</h2>
            <p style={{ opacity: 0.9, marginBottom: 22 }}>Upload a photo and see what NEXORA suggests.</p>
            <Button size="lg" variant="ghost" onClick={toApp}>Get started free</Button>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-grid">
          <div className="stack-sm"><Logo size={26} /><span>Create Smarter. Connect Better.</span></div>
          <div className="footer-links">
            <button onClick={() => jump('features')}>Features</button>
            <button onClick={() => jump('pricing')}>Pricing</button>
            <button onClick={() => jump('faq')}>FAQ</button>
            <button onClick={() => navigate('/login')}>Log in</button>
          </div>
          <div className="small" style={{ maxWidth: 360 }}>NEXORA does not guarantee reach or engagement. Trend data is AI-estimated unless a live provider is connected. Platform names belong to their owners.</div>
        </div>
      </footer>
    </div>
  )
}
