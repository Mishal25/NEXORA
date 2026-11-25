import { useEffect } from 'react'
import { ToastProvider, Spinner } from './components/ui'
import { Shell } from './components/Shell'
import { AuthProvider, useAuth } from './lib/auth'
import { StoreProvider } from './lib/store'
import { WorkspaceProvider } from './lib/workspace'
import { navigate, useRoute } from './lib/router'
import Landing from './pages/Landing'
import AuthPage from './pages/AuthPage'

function Router() {
  const route = useRoute()
  const { user, loading } = useAuth()
  const inApp = route.startsWith('/app')
  const inAuth = route === '/login' || route === '/signup'

  useEffect(() => {
    if (loading) return
    if (inApp && !user) {
      try { sessionStorage.setItem('nexora.next', route) } catch { /* ignore */ }
      navigate('/login')
    }
    if (inAuth && user) {
      let next = '/app'
      try { next = sessionStorage.getItem('nexora.next') || '/app'; sessionStorage.removeItem('nexora.next') } catch { /* ignore */ }
      navigate(next)
    }
  }, [inApp, inAuth, user, loading, route])

  if (inApp) {
    if (loading || !user) return <Spinner label="Loading NEXORA..." />
    return (
      <StoreProvider key={user.uid} user={user}>
        <Shell route={route} />
      </StoreProvider>
    )
  }
  if (inAuth) return loading ? <Spinner /> : <AuthPage mode={route === '/signup' ? 'signup' : 'login'} />
  return <Landing />
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <WorkspaceProvider>
          <Router />
        </WorkspaceProvider>
      </AuthProvider>
    </ToastProvider>
  )
}
