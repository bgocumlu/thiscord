import type { InvitePreview } from '@thiscord/shared'
import { ArrowLeft, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { communityApi } from '../features/communities/api'
import { parseAppRoute } from '../features/navigation/routes'
import { usePocketBase, useRuntimeConfig } from '../lib/contexts'
import { errorMessage } from '../lib/pocketbase'
import { useAppRouter } from '../lib/router'

type Mode = 'login' | 'register' | 'reset' | 'verify' | 'reset-confirm'

export function AuthScreen() {
  const config = useRuntimeConfig()
  const client = usePocketBase()
  const { navigate, pathname } = useAppRouter()
  const { login, register, requestPasswordReset, ready } = useAuth()
  const route = parseAppRoute(pathname)
  const initialMode: Mode = route.kind === 'auth'
    ? route.action === 'verify' ? 'verify' : 'reset-confirm'
    : 'login'
  const [mode, setMode] = useState<Mode>(initialMode)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [invite, setInvite] = useState<InvitePreview | null>(null)
  const inviteCode = route.kind === 'invite' ? route.code : ''
  const token = new URLSearchParams(window.location.search).get('token') ?? ''
  const invalidLinkMode = !token && (mode === 'verify' || mode === 'reset-confirm')
  const changeMode = (next: Mode) => {
    setError('')
    setNotice('')
    setMode(next)
  }

  useEffect(() => {
    if (!inviteCode) return
    let active = true
    void communityApi.previewInvite(client, inviteCode).then((value) => {
      if (active) setInvite(value)
    }).catch((caught) => {
      if (active) setError(errorMessage(caught))
    })
    return () => {
      active = false
    }
  }, [client, inviteCode])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setBusy(true)
    const data = new FormData(event.currentTarget)
    try {
      if (mode === 'login') {
        await login(String(data.get('identity') || ''), String(data.get('password') || ''))
      } else if (mode === 'register') {
        const password = String(data.get('password') || '')
        const confirm = String(data.get('passwordConfirm') || '')
        if (password !== confirm) throw new Error('Passwords do not match.')
        await register({
          email: String(data.get('email') || ''),
          handle: String(data.get('handle') || ''),
          displayName: String(data.get('displayName') || ''),
          password,
        })
      } else if (mode === 'reset') {
        await requestPasswordReset(String(data.get('email') || ''))
        setNotice('If that account exists, password reset instructions have been sent.')
      } else if (mode === 'verify') {
        if (!token) throw new Error('The verification link is missing its token.')
        await client.collection('users').confirmVerification(token)
        setNotice('Your email address is verified. You can sign in now.')
      } else if (mode === 'reset-confirm') {
        if (!token) throw new Error('The password reset link is missing its token.')
        const password = String(data.get('password') || '')
        const confirm = String(data.get('passwordConfirm') || '')
        if (password !== confirm) throw new Error('Passwords do not match.')
        await client.collection('users').confirmPasswordReset(token, password, confirm)
        setNotice('Your password has been changed. You can sign in now.')
      }
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="auth-brand">
          <span className="wordmark-mark"><i /><i /></span>
          <strong>{config.name}</strong>
        </div>
        <p className="auth-product-note">
          Communities, conversations, and calls in one focused workspace.
        </p>
        {invite ? (
          <div className="auth-invite-context">
            <span>Invitation</span>
            <strong>{invite.community.name}</strong>
            <small>{invite.memberCount} member{invite.memberCount === 1 ? '' : 's'} · Sign in or create an account to continue</small>
          </div>
        ) : null}

        {invalidLinkMode ? (
          <section className="auth-link-problem" role="alert">
            <span><LockKeyhole size={20} /></span>
            <header>
              <h1>{mode === 'verify' ? 'Verification link unavailable' : 'Reset link unavailable'}</h1>
              <p>
                This link is incomplete or has expired. Request a new link instead of
                entering information that cannot be saved.
              </p>
            </header>
            {mode === 'reset-confirm' ? (
              <button className="primary-action" type="button" onClick={() => changeMode('reset')}>
                Request a new reset link
              </button>
            ) : null}
            <button
              className="secondary-action"
              type="button"
              onClick={() => {
                navigate('/', { replace: true })
                changeMode('login')
              }}
            >
              Back to sign in
            </button>
          </section>
        ) : null}

        {mode === 'login' && !invalidLinkMode ? (
          <>
            <header><h1>Sign in</h1><p>Use your email address or handle.</p></header>
            <form onSubmit={submit}>
              <label><span>Email or handle</span><div><UserRound size={17} /><input name="identity" autoComplete="username" required autoFocus /></div></label>
              <label><span>Password</span><div><LockKeyhole size={17} /><input name="password" type="password" autoComplete="current-password" minLength={8} required /></div></label>
              {error ? <p className="form-error" role="alert">{error}</p> : null}
              <button className="primary-action" type="submit" disabled={!ready || busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
            </form>
            <div className="auth-links">
              <button type="button" onClick={() => changeMode('reset')}>Forgot password?</button>
              <button type="button" onClick={() => changeMode('register')}>Create account</button>
            </div>
          </>
        ) : null}

        {mode === 'register' && !invalidLinkMode ? (
          <>
            <button className="auth-back" type="button" onClick={() => changeMode('login')}><ArrowLeft size={16} />Back</button>
            <header><h1>Create account</h1></header>
            <form onSubmit={submit}>
              <label><span>Email</span><div><Mail size={17} /><input name="email" type="email" autoComplete="email" required autoFocus /></div></label>
              <label><span>Display name</span><div><UserRound size={17} /><input name="displayName" autoComplete="name" maxLength={80} required /></div></label>
              <label><span>Handle</span><div><span className="field-prefix">@</span><input name="handle" autoComplete="username" minLength={2} maxLength={32} pattern="[a-zA-Z0-9._-]+" aria-describedby="handle-help" required /></div><small className="field-hint" id="handle-help">2–32 letters, numbers, periods, dashes, or underscores.</small></label>
              <label><span>Password</span><div><LockKeyhole size={17} /><input name="password" type="password" autoComplete="new-password" minLength={8} aria-describedby="password-help" required /></div><small className="field-hint" id="password-help">Use at least 8 characters.</small></label>
              <label><span>Confirm password</span><div><LockKeyhole size={17} /><input name="passwordConfirm" type="password" autoComplete="new-password" minLength={8} required /></div></label>
              {error ? <p className="form-error" role="alert">{error}</p> : null}
              <button className="primary-action" type="submit" disabled={!ready || busy}>{busy ? 'Creating…' : 'Create account'}</button>
            </form>
          </>
        ) : null}

        {mode === 'reset' && !invalidLinkMode ? (
          <>
            <button className="auth-back" type="button" onClick={() => changeMode('login')}><ArrowLeft size={16} />Back</button>
            <header><h1>Reset password</h1><p>Enter the email address for your account.</p></header>
            <form onSubmit={submit}>
              <label><span>Email</span><div><Mail size={17} /><input name="email" type="email" autoComplete="email" required autoFocus /></div></label>
              {error ? <p className="form-error" role="alert">{error}</p> : null}
              {notice ? <p className="form-notice" role="status">{notice}</p> : null}
              <button className="primary-action" type="submit" disabled={!ready || busy}>{busy ? 'Sending…' : 'Send reset email'}</button>
            </form>
          </>
        ) : null}

        {mode === 'verify' && !invalidLinkMode ? (
          <>
            <button className="auth-back" type="button" onClick={() => { navigate('/', { replace: true }); changeMode('login') }}><ArrowLeft size={16} />Back to sign in</button>
            <header><h1>Verify email</h1><p>Confirm this email address for your account.</p></header>
            <form onSubmit={submit}>
              {error ? <p className="form-error" role="alert">{error}</p> : null}
              {notice ? <p className="form-notice" role="status">{notice}</p> : null}
              {!notice ? <button className="primary-action" type="submit" disabled={!ready || busy}>{busy ? 'Verifying…' : 'Verify email'}</button> : <button className="primary-action" type="button" onClick={() => { navigate('/', { replace: true }); changeMode('login') }}>Continue to sign in</button>}
            </form>
          </>
        ) : null}

        {mode === 'reset-confirm' && !invalidLinkMode ? (
          <>
            <button className="auth-back" type="button" onClick={() => { navigate('/', { replace: true }); changeMode('login') }}><ArrowLeft size={16} />Back to sign in</button>
            <header><h1>Choose a new password</h1><p>Enter the new password for your account.</p></header>
            <form onSubmit={submit}>
              <label><span>New password</span><div><LockKeyhole size={17} /><input name="password" type="password" autoComplete="new-password" minLength={8} required autoFocus /></div></label>
              <label><span>Confirm password</span><div><LockKeyhole size={17} /><input name="passwordConfirm" type="password" autoComplete="new-password" minLength={8} required /></div></label>
              {error ? <p className="form-error" role="alert">{error}</p> : null}
              {notice ? <p className="form-notice" role="status">{notice}</p> : null}
              {!notice ? <button className="primary-action" type="submit" disabled={!ready || busy}>{busy ? 'Changing…' : 'Change password'}</button> : <button className="primary-action" type="button" onClick={() => { navigate('/', { replace: true }); changeMode('login') }}>Continue to sign in</button>}
            </form>
          </>
        ) : null}
      </section>
    </main>
  )
}
