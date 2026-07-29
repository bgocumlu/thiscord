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
      ? 'Leave this group?'
      : `Remove ${target?.displayName ?? 'this member'} from the group?`
    if (!await confirm({
      title: userId === currentUser.id ? 'Leave this group?' : 'Remove group member?',
      description: label,
      confirmLabel: userId === currentUser.id ? 'Leave group' : 'Remove member',
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
    <ModalFrame title="Group settings" onClose={onClose}>
      {isOwner ? (
        <>
          <form className="modal-form compact-form" onSubmit={(event) => void rename(event)}>
            <label><span>Group name</span><input name="name" defaultValue={conversation.name} required maxLength={policyLimits.conversation.nameMax} /></label>
            <button className="secondary-action" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Rename group'}</button>
          </form>
          <form className="modal-form compact-form" onSubmit={(event) => void addMember(event)}>
            <label><span>Add member by handle</span><input name="handle" placeholder="@handle" required /></label>
            <button className="secondary-action" type="submit" disabled={busy}>{busy ? 'Adding…' : 'Add member'}</button>
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
              <span><strong>{user.displayName}</strong><small>@{user.handle}{conversation.owner === user.id ? ' · owner' : ''}</small></span>
              {isOwner && user.id !== currentUser.id ? (
                <button type="button" disabled={busy} onClick={() => void removeMember(user.id)}>Remove</button>
              ) : null}
            </article>
          )
        })}
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="danger-action modal-logout" type="button" disabled={busy} onClick={() => void removeMember(currentUser.id)}>
        {busy ? 'Working…' : 'Leave group'}
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
              name: String(data.get('name') || 'New group'),
            },
      ))
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }
  return (
    <ModalFrame title="New conversation" onClose={onClose}>
      <form className="modal-form" onSubmit={(event) => void submit(event)}>
        <label>
          <span>Type</span>
          <select value={kind} onChange={(event) => setKind(event.target.value as 'direct' | 'group')}>
            <option value="direct">Direct message</option>
            <option value="group">Group conversation</option>
          </select>
        </label>
        <label><span>{kind === 'direct' ? 'Handle' : 'Handles'}</span><input name="handles" placeholder={kind === 'direct' ? '@handle' : '@handle, @another'} required /></label>
        {kind === 'group' ? <label><span>Group name</span><input name="name" required maxLength={policyLimits.conversation.nameMax} /></label> : null}
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <button className="primary-action" type="submit" disabled={busy}>{busy ? 'Starting…' : 'Start conversation'}</button>
      </form>
    </ModalFrame>
  )
}
