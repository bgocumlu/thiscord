import type { InvitePreview } from '@thiscord/shared'
import { useQueryClient } from '@tanstack/react-query'
import { lazy, Suspense, useEffect, useState } from 'react'
import './App.css'
import { useAuth } from './auth/AuthProvider'
import { AuthScreen } from './components/AuthScreen'
import { LoadingState } from './components/WorkspacePrimitives'
import { communityApi } from './features/communities/api'
import { communityKeys } from './features/communities/queryKeys'
import { appRoutes, parseAppRoute } from './features/navigation/routes'
import { usePocketBase, useRuntimeConfig } from './lib/contexts'
import { errorMessage } from './lib/pocketbase'
import { AppRouter, useAppRouter } from './lib/router'

const CallProvider = lazy(() => import('./features/calls/CallProvider').then((module) => ({
  default: module.CallProvider,
})))
const WorkspaceApp = lazy(() => import('./components/WorkspaceApp').then((module) => ({
  default: module.WorkspaceApp,
})))

function InviteRoute({ code }: { readonly code: string }) {
  const client = usePocketBase()
  const config = useRuntimeConfig()
  const queryClient = useQueryClient()
  const { navigate } = useAppRouter()
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<InvitePreview | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const value = await communityApi.previewInvite(client, code)
        if (active) setPreview(value)
      } catch (caught) {
        if (active) setError(errorMessage(caught))
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [client, code])

  const accept = async () => {
    setBusy(true)
    setError('')
    try {
      const membership = await communityApi.acceptInvite(client, code)
      await queryClient.invalidateQueries({ queryKey: communityKeys.memberships })
      navigate(appRoutes.channel(membership.community), { replace: true })
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  if (!preview && !error) return <LoadingState fullscreen>Loading invitation…</LoadingState>
  if (preview) {
    return (
      <main className="fatal-startup invite-preview-page">
        <section>
          <span className="invite-kicker">You’re invited</span>
          <h1>{preview.community.name}</h1>
          {preview.community.description ? <p>{preview.community.description}</p> : null}
          <p>{preview.memberCount} member{preview.memberCount === 1 ? '' : 's'}</p>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button className="primary-action" type="button" disabled={busy} onClick={() => void accept()}>
            {busy ? 'Joining…' : 'Join community'}
          </button>
          <button type="button" className="secondary-action" onClick={() => navigate(appRoutes.conversations(), { replace: true })}>Not now</button>
        </section>
      </main>
    )
  }
  return (
    <main className="fatal-startup">
      <section>
        <h1>Invite unavailable</h1>
        <p>{error}</p>
        <button className="primary-action" type="button" onClick={() => navigate(appRoutes.conversations(), { replace: true })}>
          Open {config.name}
        </button>
      </section>
    </main>
  )
}

function AuthenticatedApp() {
  const { pathname, navigate } = useAppRouter()
  const route = parseAppRoute(pathname)
  const inviteCode = route.kind === 'invite' ? route.code : ''
  useEffect(() => {
    if (route.kind === 'unknown') {
      navigate(appRoutes.conversations(), { replace: true })
    }
  }, [navigate, route.kind])
  if (inviteCode) return <InviteRoute code={inviteCode} />
  return <WorkspaceApp />
}

function AppContent() {
  const { user, ready } = useAuth()
  const config = useRuntimeConfig()
  const { pathname } = useAppRouter()
  if (parseAppRoute(pathname).kind === 'auth') return <AuthScreen />
  if (!ready && !user) return <LoadingState fullscreen>Opening {config.name}…</LoadingState>
  return user ? (
    <Suspense fallback={<LoadingState fullscreen>Opening your workspace…</LoadingState>}>
      <CallProvider user={user}><AuthenticatedApp /></CallProvider>
    </Suspense>
  ) : <AuthScreen />
}

function App() {
  return <AppRouter><AppContent /></AppRouter>
}

export default App
