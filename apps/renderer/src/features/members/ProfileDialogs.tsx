import type { User } from '@thiscord/shared'
import { policyLimits } from '@thiscord/shared'
import { ExternalLink, LogOut, MessageSquareText } from 'lucide-react'
import type { RecordModel } from 'pocketbase'
import { useState, type FormEvent } from 'react'
import {
  ImageFileField,
  ModalFrame,
} from '../../components/WorkspacePrimitives'
import { usePocketBase, useRuntimeConfig } from '../../lib/contexts'
import { errorMessage } from '../../lib/pocketbase'
import { DesktopUpdatePanel } from '../updates/DesktopUpdatePanel'
import { Avatar } from './Avatar'
import { updateOwnPreferences } from './preferences'

export function ProfileDialog({ user, onClose, onLogout }: {
  readonly user: User
  readonly onClose: () => void
  readonly onLogout: () => void
}) {
  const client = usePocketBase()
  const config = useRuntimeConfig()
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [verificationBusy, setVerificationBusy] = useState(false)
  const avatarUrl = user.avatar
    ? client.files.getURL(user as unknown as RecordModel, user.avatar, { thumb: '256x256' })
    : ''
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    setSaved(false)
    const data = new FormData(event.currentTarget)
    try {
      const avatar = data.get('avatar')
      const newPassword = String(data.get('newPassword') || '')
      const newPasswordConfirm = String(data.get('newPasswordConfirm') || '')
      if (newPassword && newPassword !== newPasswordConfirm) {
        throw new Error('New passwords do not match.')
      }
      const record = await client.collection('users').update(user.id, {
        displayName: data.get('displayName'),
        handle: data.get('handle'),
        bio: data.get('bio'),
        status: data.get('status'),
        customStatus: data.get('customStatus'),
        ...(data.get('avatarRemove') === '1'
          ? { avatar: null }
          : avatar instanceof File && avatar.size > 0 ? { avatar } : {}),
        ...(newPassword ? {
          oldPassword: data.get('currentPassword'),
          password: newPassword,
          passwordConfirm: newPasswordConfirm,
        } : {}),
      })
      await updateOwnPreferences(client, {
        theme: data.get('theme') as 'dark' | 'light' | 'system',
        compactMode: data.get('compactMode') === 'on',
        reduceMotion: data.get('reduceMotion') === 'on',
        notificationSound: data.get('notificationSound') === 'on',
      }, record)
      setSaved(true)
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }
  const resendVerification = async () => {
    if (!user.email || verificationBusy) return
    setVerificationBusy(true)
    setError('')
    try {
      await client.collection('users').requestVerification(user.email)
      setVerificationSent(true)
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setVerificationBusy(false)
    }
  }
  const deleteAccount = async () => {
    if (busy || !window.confirm(
      'Permanently delete your account and all associated memberships and messages?',
    )) return
    setBusy(true)
    setError('')
    try {
      await client.send('/api/thiscord/account', { method: 'DELETE' })
      onLogout()
    } catch (caught) {
      setError(errorMessage(caught))
      setBusy(false)
    }
  }
  return (
    <ModalFrame title="User settings" onClose={onClose}>
      <form className="modal-form" onSubmit={(event) => void submit(event)}>
        <label><span>Display name</span><input name="displayName" defaultValue={user.displayName} required maxLength={policyLimits.profile.displayNameMax} /></label>
        <label><span>Handle</span><input name="handle" defaultValue={user.handle} required minLength={policyLimits.profile.handleMin} maxLength={policyLimits.profile.handleMax} pattern="[a-zA-Z0-9._-]+" /></label>
        <label><span>Bio</span><textarea name="bio" defaultValue={user.bio} maxLength={policyLimits.profile.bioMax} rows={3} /></label>
        <label><span>Custom status</span><input name="customStatus" defaultValue={user.customStatus} maxLength={policyLimits.profile.customStatusMax} /></label>
        <label><span>Presence</span><select name="status" defaultValue={user.status}><option value="online">Online</option><option value="idle">Idle</option><option value="dnd">Do not disturb</option><option value="offline">Invisible</option></select></label>
        <ImageFileField name="avatar" label="Avatar" currentUrl={avatarUrl} />
        <fieldset className="preference-fields">
          <legend>Appearance and notifications</legend>
          <label><span>Theme</span><select name="theme" defaultValue={user.preferences?.theme ?? 'dark'}><option value="dark">Dark</option><option value="light">Light</option><option value="system">Use system setting</option></select></label>
          <label className="checkbox-line"><input name="compactMode" type="checkbox" defaultChecked={user.preferences?.compactMode} /><span>Compact message spacing</span></label>
          <label className="checkbox-line"><input name="reduceMotion" type="checkbox" defaultChecked={user.preferences?.reduceMotion} /><span>Reduce motion</span></label>
          <label className="checkbox-line"><input name="notificationSound" type="checkbox" defaultChecked={user.preferences?.notificationSound !== false} /><span>Notification sounds</span></label>
        </fieldset>
        <details className="settings-details">
          <summary>Change password</summary>
          <label><span>Current password</span><input name="currentPassword" type="password" autoComplete="current-password" /></label>
          <label><span>New password</span><input name="newPassword" type="password" minLength={8} autoComplete="new-password" /></label>
          <label><span>Confirm new password</span><input name="newPasswordConfirm" type="password" minLength={8} autoComplete="new-password" /></label>
        </details>
        {error ? <p className="form-error">{error}</p> : null}
        {saved ? <p className="form-notice">Saved.</p> : null}
        <button className="primary-action" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
      </form>
      {user.verified === false && user.email ? (
        <div className="verification-actions">
          <span><strong>Email not verified</strong><small>{verificationSent ? 'Verification email sent.' : user.email}</small></span>
          <button className="secondary-action compact-action" type="button" disabled={verificationBusy} onClick={() => void resendVerification()}>{verificationBusy ? 'Sending…' : 'Resend'}</button>
        </div>
      ) : null}
      {window.desktop ? <DesktopUpdatePanel /> : null}
      {config.supportUrl || config.updateUrl ? (
        <div className="external-settings-links">
          {config.supportUrl ? <a className="support-link secondary-action" href={config.supportUrl} target="_blank" rel="noreferrer"><ExternalLink size={15} />Support</a> : null}
          {config.updateUrl ? <a className="support-link secondary-action" href={config.updateUrl} target="_blank" rel="noreferrer"><ExternalLink size={15} />Updates</a> : null}
        </div>
      ) : null}
      <button className="danger-action modal-logout" type="button" disabled={busy} onClick={onLogout}><LogOut size={16} />Sign out</button>
      <button className="danger-action modal-logout" type="button" disabled={busy} onClick={() => void deleteAccount()}>{busy ? 'Working…' : 'Delete account'}</button>
    </ModalFrame>
  )
}

export function MemberProfileDialog({ user, onClose, onMessage }: {
  readonly user: User
  readonly onClose: () => void
  readonly onMessage?: () => void
}) {
  return (
    <ModalFrame title={user.displayName} onClose={onClose}>
      <section className="member-profile-card">
        <Avatar user={user} size="hero" />
        <div><h3>{user.displayName}</h3><p>@{user.handle}</p></div>
        {user.customStatus ? <blockquote>{user.customStatus}</blockquote> : null}
        {user.bio
          ? <p className="member-profile-bio">{user.bio}</p>
          : <p className="member-profile-bio muted-copy">No bio.</p>}
        {onMessage ? <button className="primary-action" type="button" onClick={onMessage}><MessageSquareText size={16} />Message</button> : null}
      </section>
    </ModalFrame>
  )
}
