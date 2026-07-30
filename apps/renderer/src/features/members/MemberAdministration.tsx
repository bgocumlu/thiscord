import { t } from '../../lib/i18n'
import type { Community, Membership, Role, User } from '@thiscord/shared'
import { policyLimits } from '@thiscord/shared'
import { useQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { ModalFrame } from '../../components/WorkspacePrimitives'
import { usePocketBase } from '../../lib/contexts'
import { errorMessage } from '../../lib/pocketbase'
import { roleKeys } from '../roles/queryKeys'
import { memberApi } from './api'
import { Avatar } from './Avatar'

export type ModerationAction = 'kick' | 'ban' | 'timeout' | 'untimeout'

const moderationTitleKeys = {
  kick: 'members.administration.kickMemberTitle',
  ban: 'members.administration.banMemberTitle',
  timeout: 'members.administration.timeoutMemberTitle',
  untimeout: 'members.administration.removeTimeoutTitle',
} as const

const moderationConfirmKeys = {
  kick: 'members.administration.confirmKick',
  ban: 'members.administration.confirmBan',
  timeout: 'members.administration.confirmTimeout',
  untimeout: 'members.administration.confirmRemoveTimeout',
} as const

export function MemberAdminRow({
  community,
  membership,
  roles,
  currentUser,
  canManageRoles,
  canManageMembers,
  onChanged,
}: {
  readonly community: Community
  readonly membership: Membership
  readonly roles: Role[]
  readonly currentUser: User
  readonly canManageRoles: boolean
  readonly canManageMembers: boolean
  readonly onChanged: () => Promise<void>
}) {
  const client = usePocketBase()
  const user = membership.expand?.user
  const [error, setError] = useState('')
  const [mountedAt] = useState(() => Date.now())
  const [busy, setBusy] = useState(false)
  const [moderationAction, setModerationAction] = useState<ModerationAction | null>(null)
  const assignments = useQuery({
    queryKey: roleKeys.assignmentsForMember(membership.id),
    enabled: canManageRoles,
    queryFn: () => memberApi.roles(client, membership.id),
  })
  if (!user) return null
  const saveRoles = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const data = new FormData(event.currentTarget)
      await memberApi.setRoles(client, membership.id, data.getAll('roleIds'))
      await assignments.refetch()
      await onChanged()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }
  const saveNickname = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const data = new FormData(event.currentTarget)
      await memberApi.updateNickname(client, membership.id, data.get('nickname'))
      await onChanged()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }
  const moderate = async (
    action: ModerationAction,
    reason: string,
    durationMinutes?: number,
  ) => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await memberApi.moderate(client, community.id, {
        action,
        userId: user.id,
        reason,
        durationMinutes,
      })
      await onChanged()
      setModerationAction(null)
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <article>
        <Avatar user={user} size="small" />
        <span><strong>{membership.nickname || user.displayName}</strong><small>@{user.handle}</small></span>
        {canManageMembers ? (
          <form className="nickname-form" onSubmit={(event) => void saveNickname(event)}>
            <input
              name="nickname"
              defaultValue={membership.nickname}
              placeholder={t("members.administration.serverNickname")}
              maxLength={policyLimits.membership.nicknameMax}
              aria-label={t("members.administration.nicknameForMember", {
                memberName: user.displayName,
              })}
            />
            <button type="submit" disabled={busy}>{t("members.administration.saveNickname")}</button>
          </form>
        ) : null}
        {canManageRoles && assignments.isSuccess ? (
          <form className="member-role-form" onSubmit={(event) => void saveRoles(event)}>
            <fieldset>
              <legend>{t("members.administration.roles")}</legend>
              {roles.flatMap((role) => role.managed ? [] : [
                (
                  <label key={role.id}>
                    <input
                      name="roleIds"
                      type="checkbox"
                      value={role.id}
                      defaultChecked={assignments.data.some((item) => item.role === role.id)}
                    />
                    <i style={{ background: role.color }} />
                    <span>{role.name}</span>
                  </label>
                ),
              ])}
            </fieldset>
            <button type="submit" disabled={busy}>{busy ? t("members.administration.saving") : t("members.administration.saveRoles")}</button>
          </form>
        ) : null}
        {canManageMembers && user.id !== currentUser.id && user.id !== community.owner ? (
          <div className="member-admin-actions">
            {membership.timeoutUntil && new Date(membership.timeoutUntil).getTime() > mountedAt
              ? <button type="button" disabled={busy} onClick={() => setModerationAction('untimeout')}>{t("members.administration.removeTimeout")}</button>
              : <button type="button" disabled={busy} onClick={() => setModerationAction('timeout')}>{t("members.administration.timeout")}</button>}
            <button type="button" disabled={busy} onClick={() => setModerationAction('kick')}>{t("members.administration.kick")}</button>
            <button type="button" disabled={busy} onClick={() => setModerationAction('ban')}>{t("members.administration.ban")}</button>
          </div>
        ) : null}
        {error ? <p className="form-error" role="alert">{error}</p> : null}
      </article>
      {moderationAction ? (
        <ModerationDialog
          action={moderationAction}
          memberName={membership.nickname || user.displayName}
          busy={busy}
          onClose={() => setModerationAction(null)}
          onConfirm={(reason, duration) => moderate(moderationAction, reason, duration)}
        />
      ) : null}
    </>
  )
}

export function ModerationDialog({
  action,
  memberName,
  busy,
  onClose,
  onConfirm,
  error = '',
}: {
  readonly action: ModerationAction
  readonly memberName: string
  readonly busy: boolean
  readonly onClose: () => void
  readonly onConfirm: (reason: string, durationMinutes?: number) => Promise<void>
  readonly error?: string
}) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const duration = action === 'timeout'
      ? Math.max(1, Math.min(
          policyLimits.membership.timeoutMinutesMax,
          Number(data.get('durationMinutes') || 10),
        ))
      : undefined
    void onConfirm(String(data.get('reason') || '').trim(), duration)
  }
  return (
    <ModalFrame
      title={t(moderationTitleKeys[action], { memberName })}
      onClose={onClose}
    >
      <form className="modal-form" onSubmit={submit}>
        <p>{t("members.administration.thisActionTakesEffectImmediatelyAfterConfirmation")}</p>
        {action === 'timeout' ? (
          <label>
            <span>{t("members.administration.durationInMinutes")}</span>
            <input
              name="durationMinutes"
              type="number"
              min="1"
              max={policyLimits.membership.timeoutMinutesMax}
              defaultValue="10"
              required
            />
          </label>
        ) : null}
        <label><span>{t("members.administration.reasonOptional")}</span><textarea name="reason" maxLength={policyLimits.community.descriptionMax} rows={3} /></label>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <div className="confirmation-actions">
          <button className="secondary-action" type="button" disabled={busy} onClick={onClose}>{t("members.administration.cancel")}</button>
          <button className="danger-action" type="submit" disabled={busy}>
            {busy ? t("members.administration.working") : t(moderationConfirmKeys[action])}
          </button>
        </div>
      </form>
    </ModalFrame>
  )
}
