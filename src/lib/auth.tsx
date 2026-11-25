import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AppUser } from '../types'
import { firebaseEnabled, getFirebase } from './firebase'
import { uid as makeId } from './util'

interface AuthApi {
  user: AppUser | null
  loading: boolean
  firebaseEnabled: boolean
  signUp(name: string, email: string, password: string): Promise<void>
  signIn(email: string, password: string): Promise<void>
  google(): Promise<void>
  continueDemo(): Promise<void>
  signOut(): Promise<void>
  updateName(name: string): Promise<void>
}

const Ctx = createContext<AuthApi | null>(null)

// ---------- Demo-mode accounts (local only; for trying the app without Firebase) ----------
interface DemoAccount {
  uid: string
  name: string
  email: string
  hash: string
}
const ACCOUNTS = 'nexora.demo.accounts'
const SESSION = 'nexora.demo.session'

const readAccounts = (): Record<string, DemoAccount> => {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS) ?? '{}')
  } catch {
    return {}
  }
}
const writeAccounts = (a: Record<string, DemoAccount>) => localStorage.setItem(ACCOUNTS, JSON.stringify(a))

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('nexora-demo:' + text))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

const toUser = (a: DemoAccount): AppUser => ({ uid: a.uid, name: a.name, email: a.email, mode: 'demo' })

function friendly(e: unknown): string {
  const code = (e as { code?: string })?.code ?? ''
  const map: Record<string, string> = {
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/wrong-password': 'Incorrect email or password.',
    'auth/user-not-found': 'No account found for this email.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
    'auth/popup-blocked': 'Your browser blocked the Google sign-in popup.',
    'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
    'auth/network-request-failed': 'Network error. Check your connection.',
  }
  return map[code] ?? (e instanceof Error ? e.message : 'Something went wrong.')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let off: (() => void) | undefined
    let cancelled = false
    ;(async () => {
      if (firebaseEnabled) {
        try {
          const { auth, authMod } = await getFirebase()
          off = authMod.onAuthStateChanged(auth, (u) => {
            if (cancelled) return
            setUser(u ? { uid: u.uid, name: u.displayName || u.email?.split('@')[0] || 'Creator', email: u.email ?? '', mode: 'firebase' } : null)
            setLoading(false)
          })
          return
        } catch {
          /* fall back to demo session below */
        }
      }
      const sid = localStorage.getItem(SESSION)
      const acc = sid ? Object.values(readAccounts()).find((a) => a.uid === sid) : undefined
      if (!cancelled) {
        setUser(acc ? toUser(acc) : null)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
      off?.()
    }
  }, [])

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const mail = email.trim().toLowerCase()
    if (!name.trim()) throw new Error('Please enter your name.')
    if (password.length < 6) throw new Error('Password must be at least 6 characters.')
    if (firebaseEnabled) {
      try {
        const { auth, authMod } = await getFirebase()
        const cred = await authMod.createUserWithEmailAndPassword(auth, mail, password)
        await authMod.updateProfile(cred.user, { displayName: name.trim() })
        setUser({ uid: cred.user.uid, name: name.trim(), email: mail, mode: 'firebase' })
      } catch (e) {
        throw new Error(friendly(e))
      }
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(mail)) throw new Error('Please enter a valid email address.')
    const all = readAccounts()
    if (all[mail]) throw new Error('An account with this email already exists.')
    const acc: DemoAccount = { uid: makeId(), name: name.trim(), email: mail, hash: await sha256(password) }
    all[mail] = acc
    writeAccounts(all)
    localStorage.setItem(SESSION, acc.uid)
    setUser(toUser(acc))
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const mail = email.trim().toLowerCase()
    if (firebaseEnabled) {
      try {
        const { auth, authMod } = await getFirebase()
        await authMod.signInWithEmailAndPassword(auth, mail, password)
      } catch (e) {
        throw new Error(friendly(e))
      }
      return
    }
    const acc = readAccounts()[mail]
    if (!acc || acc.hash !== (await sha256(password))) throw new Error('Incorrect email or password.')
    localStorage.setItem(SESSION, acc.uid)
    setUser(toUser(acc))
  }, [])

  const google = useCallback(async () => {
    if (!firebaseEnabled) throw new Error('Google Sign-In needs Firebase. Add your VITE_FIREBASE_* keys, or use email or the demo account.')
    try {
      const { auth, authMod } = await getFirebase()
      await authMod.signInWithPopup(auth, new authMod.GoogleAuthProvider())
    } catch (e) {
      throw new Error(friendly(e))
    }
  }, [])

  const continueDemo = useCallback(async () => {
    const mail = 'demo@nexora.local'
    const all = readAccounts()
    if (!all[mail]) {
      all[mail] = { uid: 'demo-user', name: 'Demo Creator', email: mail, hash: await sha256('demo-account') }
      writeAccounts(all)
    }
    localStorage.setItem(SESSION, all[mail].uid)
    setUser(toUser(all[mail]))
  }, [])

  const signOut = useCallback(async () => {
    if (firebaseEnabled) {
      try {
        const { auth, authMod } = await getFirebase()
        await authMod.signOut(auth)
      } catch {
        /* ignore */
      }
    }
    localStorage.removeItem(SESSION)
    setUser(null)
  }, [])

  const updateName = useCallback(
    async (name: string) => {
      const n = name.trim()
      if (!n || !user) return
      if (user.mode === 'firebase') {
        const { auth, authMod } = await getFirebase()
        if (auth.currentUser) await authMod.updateProfile(auth.currentUser, { displayName: n })
      } else {
        const all = readAccounts()
        const key = Object.keys(all).find((k) => all[k].uid === user.uid)
        if (key) {
          all[key].name = n
          writeAccounts(all)
        }
      }
      setUser({ ...user, name: n })
    },
    [user],
  )

  const value = useMemo<AuthApi>(
    () => ({ user, loading, firebaseEnabled, signUp, signIn, google, continueDemo, signOut, updateName }),
    [user, loading, signUp, signIn, google, continueDemo, signOut, updateName],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth(): AuthApi {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth must be used inside AuthProvider')
  return c
}
