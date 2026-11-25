/**
 * Firebase is optional. When VITE_FIREBASE_* variables are missing, NEXORA runs in Demo Mode
 * (local accounts + localStorage). Firebase modules are loaded lazily so Demo Mode stays light.
 */
const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
}

export const firebaseEnabled = Boolean(cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId)

async function init() {
  const [appMod, authMod, fsMod] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
    import('firebase/firestore'),
  ])
  const app = appMod.initializeApp(cfg)
  return { auth: authMod.getAuth(app), db: fsMod.getFirestore(app), authMod, fsMod }
}

let cache: ReturnType<typeof init> | null = null

export function getFirebase() {
  if (!firebaseEnabled) return Promise.reject(new Error('Firebase is not configured.'))
  if (!cache) cache = init()
  return cache
}
