import type { InvitePreview, Membership } from '@thiscord/shared'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import './App.css'
import { useAuth } from './auth/AuthProvider'
import { AuthScreen } from './components/AuthScreen'
import { WorkspaceApp } from './components/WorkspaceApp'
import { CallProvider } from './call/CallProvider'
import { usePocketBase } from './lib/contexts'
import { errorMessage } from './lib/pocketbase'
import { AppRouter, useAppRouter } from './lib/router'

function InviteRoute({ code }: { readonly code: string }) {
  const client = usePocketBase()
  const queryClient = useQueryClient()
  const { navigate } = useAppRouter()
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<InvitePreview | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const value = await client.send<InvitePreview>(
          `/api/thiscord/invites/${encodeURIComponent(code)}/preview`,
          {},
        )
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
      const membership = await client.send<Membership>(
        `/api/thiscord/invites/${encodeURIComponent(code)}/accept`,
        { method: 'POST' },
      )
      await queryClient.invalidateQueries({ queryKey: ['memberships'] })
      navigate(`/channels/${membership.community}`, { replace: true })
    } catch (caught) {
      setError(errorMessage(caught))
      setBusy(false)
    }
  }

  if (!preview && !error) return <main className="loading-state fullscreen">Loading invitation…</main>
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
          <button type="button" className="secondary-action" onClick={() => navigate('/channels/@me', { replace: true })}>Not now</button>
        </section>
      </main>
    )
  }
  return (
    <main className="fatal-startup">
      <section>
        <h1>Invite unavailable</h1>
        <p>{error}</p>
        <button className="primary-action" type="button" onClick={() => navigate('/channels/@me', { replace: true })}>
          Open Thiscord
        </button>
      </section>
    </main>
  )
}

function AuthenticatedApp() {
  const { pathname, navigate } = useAppRouter()
  const inviteMatch = pathname.match(/^\/invite\/([^/]+)\/?$/)
  const inviteCode = inviteMatch?.[1] ?? ''
  useEffect(() => {
    if (!inviteCode && !pathname.startsWith('/channels/')) {
      navigate('/channels/@me', { replace: true })
    }
  }, [inviteCode, navigate, pathname])
  if (inviteCode) return <InviteRoute code={decodeURIComponent(inviteCode)} />
  return <WorkspaceApp />
}

function AppContent() {
  const { user, ready } = useAuth()
  const { pathname } = useAppRouter()
  if (pathname === '/auth/verify' || pathname === '/auth/reset') return <AuthScreen />
  if (!ready && !user) return <main className="loading-state fullscreen">Opening Thiscord…</main>
  return user ? <CallProvider user={user}><AuthenticatedApp /></CallProvider> : <AuthScreen />
}

function App() {
  return <AppRouter><AppContent /></AppRouter>
}

export default App
