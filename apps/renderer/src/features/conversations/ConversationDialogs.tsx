import { t } from '../../lib/i18n'
import type {
  Conversation,
  ConversationMember,
  User,
} from '@thiscord/shared'
import { policyLimits } from '@thiscord/shared'
import { useState, type FormEvent } from 'react'
import { ModalFrame } from '../../components/WorkspacePrimitives'
import { useConfirmation } from '../../hooks/useConfirmation'
import { usePocketBase } from '../../lib/contexts'
import { errorMessage } from '../../lib/pocketbase'
import { useAppRouter } from '../../lib/router'
import { memberApi } from '../members/api'
import { Avatar } from '../members/Avatar'
import { appRoutes } from '../navigation/routes'
import { conversationApi } from './api'

export function GroupSettingsDialog({
  conversation,
  members,
  currentUser,
  onClose,
  onChanged,
}: {
  readonly conversation: Conversation
  readonly members: ConversationMember[]
  readonly currentUser: User
  readonly onClose: () => void
  readonly onChanged: () => Promise<void>
}) {
  const client = usePocketBase()
  const { navigate } = useAppRouter()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { confirm, confirmation } = useConfirmation()
  const isOwner = conversation.owner === currentUser.id
  const rename = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const data = new FormData(event.currentTarget)
      await conversationApi.rename(client, conversation.id, data.get('name'))
      await onChanged()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }
  const addMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const data = new FormData(event.currentTarget)
      const handle = String(data.get('handle') || '').replace(/^@/, '').trim().toLowerCase()
      const user = await memberApi.findByHandle(client, handle) as unknown as User
      await conversationApi.addMember(client, conversation.id, user.id)
      event.currentTarget.reset()
      await onChanged()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }
  const removeMember = async (userId: string) => {
    if (busy) return
    const target = members.find((member) => member.user === userId)?.expand?.user
    const label = userId === currentUser.id
      ? t("conversations.dialogs.leaveThisGroup")
      : t("conversations.dialogs.removeNameFromTheGroup", {
        name: target?.displayName ?? t("conversations.dialogs.thisMember"),
      })
    if (!await confirm({
      title: userId === currentUser.id ? t("conversations.dialogs.leaveThisGroup") : t("conversations.dialogs.removeGroupMember"),
      description: label,
      confirmLabel: userId === currentUser.id ? t("conversations.dialogs.leaveGroup") : t("conversations.dialogs.removeMember"),
    })) return
    setBusy(true)
    setError('')
    try {
      await conversationApi.removeMember(client, conversation.id, userId)
      await onChanged()
      if (userId === currentUser.id) {
        onClose()
        navigate(appRoutes.conversations(), { replace: true })
      }
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }
  return (
    <ModalFrame title={t("conversations.dialogs.groupSettings")} onClose={onClose}>
      {isOwner ? (
        <>
          <form className="modal-form compact-form" onSubmit={(event) => void rename(event)}>
            <label><span>{t("conversations.dialogs.groupName")}</span><input name="name" defaultValue={conversation.name} required maxLength={policyLimits.conversation.nameMax} /></label>
            <button className="secondary-action" type="submit" disabled={busy}>{busy ? t("conversations.dialogs.saving") : t("conversations.dialogs.renameGroup")}</button>
          </form>
          <form className="modal-form compact-form" onSubmit={(event) => void addMember(event)}>
            <label><span>{t("conversations.dialogs.addMemberByHandle")}</span><input name="handle" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder={t("conversations.dialogs.handle")} required /></label>
            <button className="secondary-action" type="submit" disabled={busy}>{busy ? t("conversations.dialogs.adding") : t("conversations.dialogs.addMember")}</button>
          </form>
        </>
      ) : null}
      <div className="settings-list group-member-list">
        {members.map((member) => {
          const user = member.expand?.user
          if (!user) return null
          return (
            <article key={member.id}>
              <Avatar user={user} size="small" />
              <span>
                <strong>{user.displayName}</strong>
                <small>
                  {conversation.owner === user.id ? t("conversations.dialogs.handleOwner", { handle: user.handle }) : t("conversations.dialogs.handleDisplay", { handle: user.handle })}
                </small>
              </span>
              {isOwner && user.id !== currentUser.id ? (
                <button type="button" disabled={busy} onClick={() => void removeMember(user.id)}>{t("conversations.dialogs.remove")}</button>
              ) : null}
            </article>
          )
        })}
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="danger-action modal-logout" type="button" disabled={busy} onClick={() => void removeMember(currentUser.id)}>
        {busy ? t("conversations.dialogs.working") : t("conversations.dialogs.leaveGroup")}
      </button>
      {confirmation}
    </ModalFrame>
  )
}

export function DirectDialog({ onClose, onCreated }: {
  readonly onClose: () => void
  readonly onCreated: (conversation: Conversation) => Promise<void>
}) {
  const client = usePocketBase()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [kind, setKind] = useState<'direct' | 'group'>('direct')
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    const data = new FormData(event.currentTarget)
    try {
      const handles = Array.from(new Set(String(data.get('handles') || '')
        .split(',')
        .map((handle) => handle.trim().replace(/^@/, '').toLowerCase())
        .filter(Boolean)))
      const users = await Promise.all(handles.map(async (handle) => (
        await memberApi.findByHandle(client, handle) as unknown as User
      )))
      await onCreated(await conversationApi.create(
        client,
        kind === 'direct'
          ? { kind, userIds: users.map((user) => user.id) }
          : {
              kind,
              userIds: users.map((user) => user.id),
              name: String(data.get('name') || t("conversations.dialogs.newGroup")),
            },
      ))
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }
  return (
    <ModalFrame title={t("conversations.dialogs.newConversation")} onClose={onClose}>
      <form className="modal-form" onSubmit={(event) => void submit(event)}>
        <label>
          <span>{t("conversations.dialogs.type")}</span>
          <select value={kind} onChange={(event) => setKind(event.target.value as 'direct' | 'group')}>
            <option value="direct">{t("conversations.dialogs.directMessage")}</option>
            <option value="group">{t("conversations.dialogs.groupConversation")}</option>
          </select>
        </label>
        <label><span>{kind === 'direct' ? t("conversations.dialogs.handle") : t("conversations.dialogs.handles")}</span><input name="handles" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder={kind === 'direct' ? t("conversations.dialogs.handle") : t("conversations.dialogs.handleAnother")} required /></label>
        {kind === 'group' ? <label><span>{t("conversations.dialogs.groupName")}</span><input name="name" required maxLength={policyLimits.conversation.nameMax} /></label> : null}
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <button className="primary-action" type="submit" disabled={busy}>{busy ? t("conversations.dialogs.starting") : t("conversations.dialogs.startConversation")}</button>
      </form>
    </ModalFrame>
  )
}
