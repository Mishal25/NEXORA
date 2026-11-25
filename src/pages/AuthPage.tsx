import { useState, type FormEvent } from 'react'
import { Button, Field, Icon, Logo, Notice } from '../components/ui'
import { useAuth } from '../lib/auth'
import { navigate } from '../lib/router'

export default function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const auth = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const signup = mode === 'signup'

  const wrap = async (key: string, fn: () => Promise<void>) => {
    setError('')
    setBusy(key)
    try { await fn() } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong.') } finally { setBusy('') }
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    void wrap('form', () => (signup ? auth.signUp(name, email, password) : auth.signIn(email, password)))
  }

  return (
    <div className="auth">
      <div className="auth-side">
        <a href="#/"><Logo /></a>
        <div>
          <h2>Create Smarter.<br />Connect Better.</h2>
          <ul style={{ paddingLeft: 18 }}>
            <li>Photo-aware hashtags and captions for 7 platforms</li>
            <li>Honest labels: AI-estimated vs. live data</li>
            <li>Never auto-tags. You stay in control.</li>
          </ul>
        </div>
        <span className="small" style={{ opacity: 0.8 }}>NEXORA AI social media intelligence</span>
      </div>
      <div className="auth-form">
        <form className="auth-box" onSubmit={submit} noValidate>
          <div style={{ display: 'none' }} className="mobile-logo" />
          <div>
            <h1 style={{ fontSize: 28 }}>{signup ? 'Create your account' : 'Welcome back'}</h1>
            <p className="muted small" style={{ marginTop: 6 }}>{signup ? 'Start with the free plan. No card needed.' : 'Log in to continue to NEXORA.'}</p>
          </div>
          {!auth.firebaseEnabled && (
            <Notice>Firebase isn't configured, so NEXORA is running in <strong>Demo Mode</strong>: accounts and data stay in this browser only.</Notice>
          )}
          <Button type="button" variant="ghost" size="lg" className="block" loading={busy === 'google'} onClick={() => wrap('google', auth.google)}>
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.2 5.5-4.7 7.2l7.6 5.9c4.4-4.1 6.9-10.1 6.9-17.6z"/><path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 010-9.4l-7.9-6.1a24 24 0 000 21.6l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>
            Continue with Google
          </Button>
          <div className="divider">or with email</div>
          {signup && <Field label="Name"><input type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" /></Field>}
          <Field label="Email"><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></Field>
          <Field label="Password" hint={signup ? 'At least 6 characters.' : undefined}>
            <input type="password" autoComplete={signup ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </Field>
          {error && <div className="notice err" role="alert"><Icon name="alert" /><div>{error}</div></div>}
          <Button type="submit" size="lg" className="block" loading={busy === 'form'}>{signup ? 'Create account' : 'Log in'}</Button>
          {!auth.firebaseEnabled && (
            <Button type="button" variant="soft" className="block" loading={busy === 'demo'} onClick={() => wrap('demo', auth.continueDemo)}>Continue with demo account</Button>
          )}
          <p className="small muted center">
            {signup ? 'Already have an account? ' : 'New to NEXORA? '}
            <a href={signup ? '#/login' : '#/signup'} onClick={() => navigate(signup ? '/login' : '/signup')}>{signup ? 'Log in' : 'Create an account'}</a>
          </p>
        </form>
      </div>
    </div>
  )
}
