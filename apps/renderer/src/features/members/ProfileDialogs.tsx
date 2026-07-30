import { setLocalePreference, t } from '../../lib/i18n'
import type { User } from '@thiscord/shared'
import { policyLimits } from '@thiscord/shared'
import { ExternalLink, LogOut, MessageSquareText } from 'lucide-react'
import type { RecordModel } from 'pocketbase'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import {
  ConfirmDialog,
  ImageFileField,
  ModalFrame,
} from '../../components/WorkspacePrimitives'
import { usePocketBase, useRuntimeConfig } from '../../lib/contexts'
import {
  browserLocaleStorage,
  readLocalePreference,
  type LocalePreference,
} from '../../lib/locale'
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
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [localePreference, setLocalePreferenceState] = useState<LocalePreference>(
    () => readLocalePreference(browserLocaleStorage()),
  )
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
        throw new Error(t("members.profileDialogs.newPasswordsDoNotMatch"))
      }
      const record = await client.collection('users').update(user.id, {
        displayName: data.get('displayName'),
        handle: data.get('handle'),
        bio: data.get('bio'),
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
        presenceStatus: data.get('status') as User['status'],
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
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await client.send('/api/thiscord/account', { method: 'DELETE' })
      onLogout()
    } catch (caught) {
      setError(errorMessage(caught))
      setDeleteOpen(false)
    } finally {
      setBusy(false)
    }
  }
  const changeLocale = (event: ChangeEvent<HTMLSelectElement>) => {
    const preference = event.currentTarget.value as LocalePreference
    setLocalePreferenceState(preference)
    void setLocalePreference(preference)
  }
  return (
    <ModalFrame title={t("members.profileDialogs.userSettings")} onClose={onClose}>
      <form className="modal-form" onSubmit={(event) => void submit(event)}>
        <label><span>{t("members.profileDialogs.displayName")}</span><input name="displayName" autoComplete="name" defaultValue={user.displayName} required maxLength={policyLimits.profile.displayNameMax} /></label>
        <label><span>{t("members.profileDialogs.handle")}</span><input name="handle" autoComplete="username" defaultValue={user.handle} required minLength={policyLimits.profile.handleMin} maxLength={policyLimits.profile.handleMax} pattern="[a-zA-Z0-9._-]+" /></label>
        <label><span>{t("members.profileDialogs.bio")}</span><textarea name="bio" autoComplete="off" defaultValue={user.bio} maxLength={policyLimits.profile.bioMax} rows={3} /></label>
        <label><span>{t("members.profileDialogs.presence")}</span><select name="status" defaultValue={user.status}><option value="online">{t("members.profileDialogs.online")}</option><option value="idle">{t("members.profileDialogs.idle")}</option><option value="dnd">{t("members.profileDialogs.doNotDisturb")}</option><option value="offline">{t("members.profileDialogs.invisible")}</option></select></label>
        <ImageFileField name="avatar" label={t("members.profileDialogs.avatar")} currentUrl={avatarUrl} />
        <fieldset className="preference-fields">
          <legend>{t("members.profileDialogs.appearanceAndNotifications")}</legend>
          <label>
            <span>{t("members.profileDialogs.language")}</span>
            <select
              name="language"
              value={localePreference}
              onChange={changeLocale}
            >
              <option value="auto">{t("members.profileDialogs.automaticLanguage")}</option>
              <option value="en">{t("members.profileDialogs.english")}</option>
              <option value="tr">{t("members.profileDialogs.turkish")}</option>
            </select>
            <small className="field-description">
              {t("members.profileDialogs.languageStoredOnThisDevice")}
            </small>
          </label>
          <label><span>{t("members.profileDialogs.theme")}</span><select name="theme" defaultValue={user.preferences?.theme ?? 'dark'}><option value="dark">{t("members.profileDialogs.dark")}</option><option value="light">{t("members.profileDialogs.light")}</option><option value="system">{t("members.profileDialogs.useSystemSetting")}</option></select></label>
          <label className="checkbox-line"><input name="compactMode" type="checkbox" defaultChecked={user.preferences?.compactMode} /><span>{t("members.profileDialogs.compactMessageSpacing")}</span></label>
          <label className="checkbox-line"><input name="reduceMotion" type="checkbox" defaultChecked={user.preferences?.reduceMotion} /><span>{t("members.profileDialogs.reduceMotion")}</span></label>
          <label className="checkbox-line"><input name="notificationSound" type="checkbox" defaultChecked={user.preferences?.notificationSound !== false} /><span>{t("members.profileDialogs.notificationSounds")}</span></label>
        </fieldset>
        <details className="settings-details">
          <summary>{t("members.profileDialogs.changePassword")}</summary>
          <label><span>{t("members.profileDialogs.currentPassword")}</span><input name="currentPassword" type="password" autoComplete="current-password" /></label>
          <label><span>{t("members.profileDialogs.newPassword")}</span><input name="newPassword" type="password" minLength={8} autoComplete="new-password" /></label>
          <label><span>{t("members.profileDialogs.confirmNewPassword")}</span><input name="newPasswordConfirm" type="password" minLength={8} autoComplete="new-password" /></label>
        </details>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        {saved ? <p className="form-notice" role="status">{t("members.profileDialogs.saved")}</p> : null}
        <button className="primary-action" type="submit" disabled={busy}>{busy ? t("members.profileDialogs.saving") : t("members.profileDialogs.saveChanges")}</button>
      </form>
      {user.verified === false && user.email ? (
        <div className="verification-actions">
          <span><strong>{t("members.profileDialogs.emailNotVerified")}</strong><small>{verificationSent ? t("members.profileDialogs.verificationEmailSent") : user.email}</small></span>
          <button className="secondary-action compact-action" type="button" disabled={verificationBusy} onClick={() => void resendVerification()}>{verificationBusy ? t("members.profileDialogs.sending") : t("members.profileDialogs.resend")}</button>
        </div>
      ) : null}
      {window.desktop ? <DesktopUpdatePanel /> : null}
      {config.supportUrl || config.updateUrl ? (
        <div className="external-settings-links">
          {config.supportUrl ? <a className="support-link secondary-action" href={config.supportUrl} target="_blank" rel="noreferrer"><ExternalLink size={15} />{t("members.profileDialogs.support")}</a> : null}
          {config.updateUrl ? <a className="support-link secondary-action" href={config.updateUrl} target="_blank" rel="noreferrer"><ExternalLink size={15} />{t("members.profileDialogs.updates")}</a> : null}
        </div>
      ) : null}
      <button className="danger-action modal-logout" type="button" disabled={busy} onClick={onLogout}><LogOut size={16} />{t("members.profileDialogs.signOut")}</button>
      <button className="danger-action modal-logout" type="button" disabled={busy} onClick={() => setDeleteOpen(true)}>{t("members.profileDialogs.deleteAccount")}</button>
      {deleteOpen ? (
        <ConfirmDialog
          title={t("members.profileDialogs.permanentlyDeleteAccount")}
          description={t("members.profileDialogs.deleteAccountDescription", {
            handle: user.handle,
          })}
          confirmLabel={t("members.profileDialogs.deleteAccountPermanently")}
          busy={busy}
          onClose={() => setDeleteOpen(false)}
          onConfirm={deleteAccount}
        />
      ) : null}
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
        {user.bio
          ? <p className="member-profile-bio">{user.bio}</p>
          : <p className="member-profile-bio muted-copy">{t("members.profileDialogs.noBio")}</p>}
        {onMessage ? <button className="primary-action" type="button" onClick={onMessage}><MessageSquareText size={16} />{t("members.profileDialogs.message")}</button> : null}
      </section>
    </ModalFrame>
  )
}
