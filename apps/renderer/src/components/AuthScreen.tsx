import { t } from '../lib/i18n'
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
        if (password !== confirm) throw new Error(t("auth.screen.passwordsDoNotMatch"))
        await register({
          email: String(data.get('email') || ''),
          handle: String(data.get('handle') || ''),
          displayName: String(data.get('displayName') || ''),
          password,
        })
      } else if (mode === 'reset') {
        await requestPasswordReset(String(data.get('email') || ''))
        setNotice(t("auth.screen.passwordResetRequested"))
      } else if (mode === 'verify') {
        if (!token) throw new Error(t("auth.screen.theVerificationLinkIsMissingItsToken"))
        await client.collection('users').confirmVerification(token)
        setNotice(t("auth.screen.yourEmailAddressIsVerifiedYouCanSignInNow"))
      } else if (mode === 'reset-confirm') {
        if (!token) throw new Error(t("auth.screen.thePasswordResetLinkIsMissingItsToken"))
        const password = String(data.get('password') || '')
        const confirm = String(data.get('passwordConfirm') || '')
        if (password !== confirm) throw new Error(t("auth.screen.passwordsDoNotMatch"))
        await client.collection('users').confirmPasswordReset(token, password, confirm)
        setNotice(t("auth.screen.yourPasswordHasBeenChangedYouCanSignInNow"))
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

          {t("auth.screen.communitiesConversationsAndCallsInOneFocusedWorkspace")}
        </p>
        {invite ? (
          <div className="auth-invite-context">
            <span>{t("auth.screen.invitation")}</span>
            <strong>{invite.community.name}</strong>
            <small>{t("auth.invite.memberPrompt", { count: invite.memberCount })}</small>
          </div>
        ) : null}

        {invalidLinkMode ? (
          <section className="auth-link-problem" role="alert">
            <span><LockKeyhole size={20} /></span>
            <header>
              <h1>{mode === 'verify' ? t("auth.screen.verificationLinkUnavailable") : t("auth.screen.resetLinkUnavailable")}</h1>
              <p>

                {t("auth.screen.invalidActionLink")}
              </p>
            </header>
            {mode === 'reset-confirm' ? (
              <button className="primary-action" type="button" onClick={() => changeMode('reset')}>

                {t("auth.screen.requestANewResetLink")}
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

              {t("auth.screen.backToSignIn")}
            </button>
          </section>
        ) : null}

        {mode === 'login' && !invalidLinkMode ? (
          <>
            <header><h1>{t("auth.screen.signIn")}</h1><p>{t("auth.screen.useYourEmailAddressOrHandle")}</p></header>
            <form onSubmit={submit}>
              <label><span>{t("auth.screen.emailOrHandle")}</span><div><UserRound size={17} /><input name="identity" autoComplete="username" required autoFocus /></div></label>
              <label><span>{t("auth.screen.password")}</span><div><LockKeyhole size={17} /><input name="password" type="password" autoComplete="current-password" minLength={8} required /></div></label>
              {error ? <p className="form-error" role="alert">{error}</p> : null}
              <button className="primary-action" type="submit" disabled={!ready || busy}>{busy ? t("auth.screen.signingIn") : t("auth.screen.signIn")}</button>
            </form>
            <div className="auth-links">
              <button type="button" onClick={() => changeMode('reset')}>{t("auth.screen.forgotPassword")}</button>
              <button type="button" onClick={() => changeMode('register')}>{t("auth.screen.createAccount")}</button>
            </div>
          </>
        ) : null}

        {mode === 'register' && !invalidLinkMode ? (
          <>
            <button className="auth-back" type="button" onClick={() => changeMode('login')}><ArrowLeft size={16} />{t("auth.screen.back")}</button>
            <header><h1>{t("auth.screen.createAccount")}</h1></header>
            <form onSubmit={submit}>
              <label><span>{t("auth.screen.email")}</span><div><Mail size={17} /><input name="email" type="email" autoComplete="email" required autoFocus /></div></label>
              <label><span>{t("auth.screen.displayName")}</span><div><UserRound size={17} /><input name="displayName" autoComplete="name" maxLength={80} required /></div></label>
              <label><span>{t("auth.screen.handle")}</span><div><span className="field-prefix">@</span><input name="handle" autoComplete="username" minLength={2} maxLength={32} pattern="[a-zA-Z0-9._-]+" aria-describedby="handle-help" required /></div><small className="field-hint" id="handle-help">{t("auth.screen.handleRequirements")}</small></label>
              <label><span>{t("auth.screen.password")}</span><div><LockKeyhole size={17} /><input name="password" type="password" autoComplete="new-password" minLength={8} aria-describedby="password-help" required /></div><small className="field-hint" id="password-help">{t("auth.screen.useAtLeast8Characters")}</small></label>
              <label><span>{t("auth.screen.confirmPassword")}</span><div><LockKeyhole size={17} /><input name="passwordConfirm" type="password" autoComplete="new-password" minLength={8} required /></div></label>
              {error ? <p className="form-error" role="alert">{error}</p> : null}
              <button className="primary-action" type="submit" disabled={!ready || busy}>{busy ? t("auth.screen.creating") : t("auth.screen.createAccount")}</button>
            </form>
          </>
        ) : null}

        {mode === 'reset' && !invalidLinkMode ? (
          <>
            <button className="auth-back" type="button" onClick={() => changeMode('login')}><ArrowLeft size={16} />{t("auth.screen.back")}</button>
            <header><h1>{t("auth.screen.resetPassword")}</h1><p>{t("auth.screen.enterTheEmailAddressForYourAccount")}</p></header>
            <form onSubmit={submit}>
              <label><span>{t("auth.screen.email")}</span><div><Mail size={17} /><input name="email" type="email" autoComplete="email" required autoFocus /></div></label>
              {error ? <p className="form-error" role="alert">{error}</p> : null}
              {notice ? <p className="form-notice" role="status">{notice}</p> : null}
              <button className="primary-action" type="submit" disabled={!ready || busy}>{busy ? t("auth.screen.sending") : t("auth.screen.sendResetEmail")}</button>
            </form>
          </>
        ) : null}

        {mode === 'verify' && !invalidLinkMode ? (
          <>
            <button className="auth-back" type="button" onClick={() => { navigate('/', { replace: true }); changeMode('login') }}><ArrowLeft size={16} />{t("auth.screen.backToSignIn")}</button>
            <header><h1>{t("auth.screen.verifyEmail")}</h1><p>{t("auth.screen.confirmThisEmailAddressForYourAccount")}</p></header>
            <form onSubmit={submit}>
              {error ? <p className="form-error" role="alert">{error}</p> : null}
              {notice ? <p className="form-notice" role="status">{notice}</p> : null}
              {!notice ? <button className="primary-action" type="submit" disabled={!ready || busy}>{busy ? t("auth.screen.verifying") : t("auth.screen.verifyEmail")}</button> : <button className="primary-action" type="button" onClick={() => { navigate('/', { replace: true }); changeMode('login') }}>{t("auth.screen.continueToSignIn")}</button>}
            </form>
          </>
        ) : null}

        {mode === 'reset-confirm' && !invalidLinkMode ? (
          <>
            <button className="auth-back" type="button" onClick={() => { navigate('/', { replace: true }); changeMode('login') }}><ArrowLeft size={16} />{t("auth.screen.backToSignIn")}</button>
            <header><h1>{t("auth.screen.chooseANewPassword")}</h1><p>{t("auth.screen.enterTheNewPasswordForYourAccount")}</p></header>
            <form onSubmit={submit}>
              <label><span>{t("auth.screen.newPassword")}</span><div><LockKeyhole size={17} /><input name="password" type="password" autoComplete="new-password" minLength={8} required autoFocus /></div></label>
              <label><span>{t("auth.screen.confirmPassword")}</span><div><LockKeyhole size={17} /><input name="passwordConfirm" type="password" autoComplete="new-password" minLength={8} required /></div></label>
              {error ? <p className="form-error" role="alert">{error}</p> : null}
              {notice ? <p className="form-notice" role="status">{notice}</p> : null}
              {!notice ? <button className="primary-action" type="submit" disabled={!ready || busy}>{busy ? t("auth.screen.changing") : t("auth.screen.changePassword")}</button> : <button className="primary-action" type="button" onClick={() => { navigate('/', { replace: true }); changeMode('login') }}>{t("auth.screen.continueToSignIn")}</button>}
            </form>
          </>
        ) : null}
      </section>
    </main>
  )
}
