import type {
  Community,
  Invite,
  Membership,
  Permission,
  Role,
  User,
} from '@thiscord/shared'
import { policyLimits } from '@thiscord/shared'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { Search, X } from 'lucide-react'
import type { RecordModel } from 'pocketbase'
import { useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import {
  DataFailure,
  formatTime,
  ImageFileField,
  useDialogAccessibility,
} from '../../components/WorkspacePrimitives'
import { usePocketBase, useRuntimeConfig } from '../../lib/contexts'
import { errorMessage } from '../../lib/pocketbase'
import { MemberAdminRow } from '../members/MemberAdministration'
import { RoleSettings } from '../roles/RoleSettings'
import { communityApi, type BanRecord } from './api'
import { communityKeys } from './queryKeys'

type SettingsTab = 'general' | 'invites' | 'roles' | 'members' | 'audit'

export function CommunitySettingsDialog({
  community,
  roles,
  memberships,
  memberRoles,
  hasMoreMembers,
  loadingMoreMembers,
  onLoadMoreMembers,
  currentUser,
  permissions,
  highestRolePosition,
  owner,
  onClose,
  onChanged,
  onDeleted,
}: {
  readonly community: Community
  readonly roles: Role[]
  readonly memberships: Membership[]
  readonly memberRoles: readonly { readonly membership: string; readonly role: string }[]
  readonly hasMoreMembers: boolean
  readonly loadingMoreMembers: boolean
  readonly onLoadMoreMembers: () => void
  readonly currentUser: User
  readonly permissions: ReadonlySet<Permission>
  readonly highestRolePosition: number
  readonly owner: boolean
  readonly onClose: () => void
  readonly onChanged: () => Promise<void>
  readonly onDeleted: () => void
}) {
  const client = usePocketBase()
  const config = useRuntimeConfig()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<SettingsTab>('general')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [memberSearch, setMemberSearch] = useState('')
  const dialogRef = useRef<HTMLElement>(null)
  useDialogAccessibility(dialogRef, onClose)
  const iconUrl = community.icon
    ? client.files.getURL(community as unknown as RecordModel, community.icon, { thumb: '256x256' })
    : ''
  const bannerUrl = community.banner
    ? client.files.getURL(community as unknown as RecordModel, community.banner, { thumb: '1200x300' })
    : ''
  const availableTabs: SettingsTab[] = [
    'general',
    ...(permissions.has('create_invites') || permissions.has('manage_community')
      ? ['invites' as const]
      : []),
    ...(permissions.has('manage_roles') ? ['roles' as const] : []),
    ...(permissions.has('manage_members') || permissions.has('manage_roles')
      ? ['members' as const]
      : []),
    ...(permissions.has('view_audit_log') ? ['audit' as const] : []),
  ]
  const invites = useInfiniteQuery({
    queryKey: communityKeys.invites(community.id),
    enabled: tab === 'invites',
    initialPageParam: 1,
    queryFn: ({ pageParam }) => communityApi.invites(client, community.id, pageParam),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
  })
  const audit = useInfiniteQuery({
    queryKey: communityKeys.audit(community.id),
    enabled: tab === 'audit',
    initialPageParam: 1,
    queryFn: ({ pageParam }) => communityApi.audit(client, community.id, pageParam),
    getNextPageParam: (lastPage) => (
      lastPage.items.length === lastPage.perPage ? lastPage.page + 1 : undefined
    ),
  })
  const bans = useInfiniteQuery({
    queryKey: communityKeys.bans(community.id),
    enabled: tab === 'members' && permissions.has('manage_members'),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => communityApi.bans(client, community.id, pageParam),
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.page + 1 : undefined,
  })
  const normalizedMemberSearch = memberSearch.trim().toLowerCase()
  const filteredMemberships = memberships.filter((membership) => {
    if (!normalizedMemberSearch) return true
    const user = membership.expand?.user
    return [
      membership.nickname,
      user?.displayName,
      user?.handle,
      user?.email,
    ].some((value) => value?.toLowerCase().includes(normalizedMemberSearch))
  })
  const administratorRoleIds = new Set(
    roles.filter((role) => role.permissions.includes('administrator')).map((role) => role.id),
  )
  const transferCandidates = memberships.filter((membership) => (
    membership.user !== currentUser.id
    && membership.expand?.user
    && memberRoles.some((assignment) => (
      assignment.membership === membership.id && administratorRoleIds.has(assignment.role)
    ))
  ))

  const saveGeneral = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    setNotice('')
    const data = new FormData(event.currentTarget)
    try {
      await communityApi.update(client, community.id, {
        name: data.get('name'),
        description: data.get('description'),
        ...(data.get('iconRemove') === '1' ? { icon: null } : { icon: data.get('icon') }),
        ...(data.get('bannerRemove') === '1' ? { banner: null } : { banner: data.get('banner') }),
      })
      await onChanged()
      setNotice('Community settings saved.')
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }
  const createInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    const data = new FormData(event.currentTarget)
    try {
      const invite = await communityApi.createInvite(client, community.id, {
        expiresInHours: Number(data.get('expiresInHours') || 168),
        maxUses: Number(data.get('maxUses') || 0),
      })
      await queryClient.invalidateQueries({ queryKey: communityKeys.invites(community.id) })
      await navigator.clipboard.writeText(
        `${config.webUrl.replace(/\/$/, '')}/invite/${invite.code}`,
      )
      setNotice('Invite created and copied.')
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }
  const copyInvite = async (invite: Invite) => {
    setError('')
    setNotice('')
    try {
      await navigator.clipboard.writeText(
        `${config.webUrl.replace(/\/$/, '')}/invite/${invite.code}`,
      )
      setNotice(`Invite ${invite.code} copied.`)
    } catch (caught) {
      setError(`Could not copy the invite: ${errorMessage(caught)}`)
    }
  }
  const revokeInvite = async (invite: Invite) => {
    if (!window.confirm(`Revoke invite ${invite.code}?`)) return
    setError('')
    try {
      await communityApi.revokeInvite(client, invite.id)
      await queryClient.invalidateQueries({ queryKey: communityKeys.invites(community.id) })
      setNotice(`Invite ${invite.code} revoked.`)
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }
  const unban = async (ban: BanRecord) => {
    if (!window.confirm(`Unban ${ban.expand?.user?.displayName ?? 'this member'}?`)) return
    setError('')
    try {
      await communityApi.unban(client, ban.id)
      await bans.refetch()
      setNotice(`${ban.expand?.user?.displayName ?? 'Member'} was unbanned.`)
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }
  const deleteCommunity = async () => {
    if (
      busy
      || !window.confirm(`Permanently delete ${community.name} and all of its data?`)
    ) return
    setBusy(true)
    try {
      await communityApi.remove(client, community.id)
      onDeleted()
    } catch (caught) {
      setError(errorMessage(caught))
      setBusy(false)
    }
  }
  const leaveCommunity = async () => {
    if (busy || !window.confirm(`Leave ${community.name}?`)) return
    setBusy(true)
    setError('')
    try {
      await communityApi.leave(client, community.id)
      onDeleted()
    } catch (caught) {
      setError(errorMessage(caught))
      setBusy(false)
    }
  }
  const transferOwnership = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (
      busy
      || !window.confirm(
        'Transfer ownership? This changes who has final control of the community.',
      )
    ) return
    setBusy(true)
    setError('')
    const data = new FormData(event.currentTarget)
    try {
      await communityApi.transfer(client, community.id, data.get('userId'))
      await onChanged()
      setNotice('Ownership transferred.')
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return createPortal(
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section
        ref={dialogRef}
        className="settings-card"
        role="dialog"
        aria-modal="true"
        aria-label={`${community.name} settings`}
      >
        <aside>
          <strong>{community.name}</strong>
          {availableTabs.map((item) => (
            <button
              className={tab === item ? 'active' : ''}
              type="button"
              onClick={() => {
                setTab(item)
                setError('')
                setNotice('')
              }}
              key={item}
            >{item}</button>
          ))}
        </aside>
        <div className="settings-content">
          <header>
            <h2>{tab[0].toUpperCase() + tab.slice(1)}</h2>
            <button type="button" aria-label={`Close ${community.name} settings`} onClick={onClose}>
              <X size={18} />
            </button>
          </header>
          {error ? <p className="form-error settings-feedback">{error}</p> : null}
          {notice ? <p className="form-notice settings-feedback">{notice}</p> : null}
          {tab === 'general' ? (
            <>
              {permissions.has('manage_community') ? (
                <form className="modal-form" onSubmit={(event) => void saveGeneral(event)}>
                  <label><span>Name</span><input name="name" defaultValue={community.name} required maxLength={policyLimits.community.nameMax} /></label>
                  <label><span>Description</span><textarea name="description" defaultValue={community.description} maxLength={policyLimits.community.descriptionMax} rows={4} /></label>
                  <ImageFileField name="icon" label="Community icon" currentUrl={iconUrl} />
                  <ImageFileField name="banner" label="Community banner" currentUrl={bannerUrl} accept="image/png,image/jpeg,image/webp" banner />
                  <button className="primary-action" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
                </form>
              ) : (
                <div className="settings-summary">
                  <h3>{community.name}</h3><p>{community.description || 'No description.'}</p>
                </div>
              )}
              {community.owner === currentUser.id ? (
                <>
                  <form className="modal-form compact-form" onSubmit={(event) => void transferOwnership(event)}>
                    <label>
                      <span>Transfer ownership to an administrator</span>
                      <select name="userId" required defaultValue="" disabled={!transferCandidates.length}>
                        <option value="" disabled>
                          {transferCandidates.length
                            ? 'Select an administrator'
                            : hasMoreMembers
                              ? 'Load more members to find administrators'
                              : 'No other administrators'}
                        </option>
                        {transferCandidates.map((membership) => (
                          <option value={membership.user} key={membership.id}>
                            {membership.expand!.user!.displayName} (@{membership.expand!.user!.handle})
                          </option>
                        ))}
                      </select>
                    </label>
                    <button className="secondary-action" type="submit" disabled={busy || !transferCandidates.length}>Transfer ownership</button>
                    {hasMoreMembers ? <button className="secondary-action" type="button" disabled={loadingMoreMembers} onClick={onLoadMoreMembers}>{loadingMoreMembers ? 'Loading…' : 'Load more members'}</button> : null}
                  </form>
                  <section className="settings-danger">
                    <h3>Delete community</h3>
                    <p>All channels, messages, roles, and memberships will be removed.</p>
                    <button className="danger-action" type="button" onClick={() => void deleteCommunity()}>Delete community</button>
                  </section>
                </>
              ) : (
                <section className="settings-danger">
                  <h3>Leave community</h3>
                  <button className="danger-action" type="button" onClick={() => void leaveCommunity()}>Leave community</button>
                </section>
              )}
            </>
          ) : null}
          {tab === 'invites' ? (
            <>
              <form className="modal-form compact-form invite-create-form" onSubmit={(event) => void createInvite(event)}>
                <label><span>Expires after</span><select name="expiresInHours" defaultValue="168"><option value="1">1 hour</option><option value="24">1 day</option><option value="168">7 days</option><option value="720">30 days</option><option value="0">Never</option></select><small>Choose when the invite link expires</small></label>
                <label><span>Maximum uses</span><input name="maxUses" type="number" min="0" defaultValue="0" /><small>0 means unlimited</small></label>
                <button className="primary-action" type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create and copy invite'}</button>
              </form>
              <div className="settings-list">
                {(invites.data?.pages.flatMap((page) => page.items) ?? []).map((invite) => (
                  <article key={invite.id}>
                    <span>
                      <strong>{invite.code}</strong>
                      <small>
                        {invite.revoked
                          ? 'Revoked'
                          : `${invite.uses}${invite.maxUses ? ` / ${invite.maxUses}` : ''} uses`}
                        {' · '}{invite.expiresAt ? `expires ${formatTime(invite.expiresAt)}` : 'never expires'}
                      </small>
                    </span>
                    <div>
                      <button type="button" onClick={() => void copyInvite(invite)}>Copy</button>
                      {!invite.revoked ? <button type="button" onClick={() => void revokeInvite(invite)}>Revoke</button> : null}
                    </div>
                  </article>
                ))}
                {invites.isLoading ? <p>Loading invites…</p> : null}
                {invites.hasNextPage ? <button className="secondary-action" type="button" disabled={invites.isFetchingNextPage} onClick={() => void invites.fetchNextPage()}>{invites.isFetchingNextPage ? 'Loading…' : 'Load older invites'}</button> : null}
              </div>
            </>
          ) : null}
          {tab === 'roles' ? (
            <RoleSettings
              community={community}
              roles={roles}
              permissions={permissions}
              highestRolePosition={highestRolePosition}
              owner={owner}
              onChanged={onChanged}
            />
          ) : null}
          {tab === 'members' ? (
            <>
              <div className="member-admin-toolbar">
                <div>
                  <strong>Community members</strong>
                  <small>
                    Roles and nicknames apply across this community. Configure
                    channel-specific access in Channel settings.
                  </small>
                </div>
                <label className="member-admin-search">
                  <Search size={15} />
                  <input
                    type="search"
                    value={memberSearch}
                    onChange={(event) => setMemberSearch(event.target.value)}
                    placeholder="Search members"
                    aria-label="Search community members"
                  />
                </label>
              </div>
              <p className="member-result-count">
                {normalizedMemberSearch
                  ? `${filteredMemberships.length} matching loaded members`
                  : `${memberships.length}${hasMoreMembers ? '+' : ''} members loaded`}
              </p>
              <div className="settings-list member-admin-list">
                {filteredMemberships.map((membership) => (
                  <MemberAdminRow
                    community={community}
                    membership={membership}
                    roles={roles}
                    currentUser={currentUser}
                    canManageRoles={permissions.has('manage_roles')}
                    canManageMembers={permissions.has('manage_members')}
                    onChanged={onChanged}
                    key={membership.id}
                  />
                ))}
                {normalizedMemberSearch && !filteredMemberships.length ? (
                  <div className="member-search-empty">
                    <strong>No matching members</strong>
                    <span>Try a display name, nickname, handle, or email address.</span>
                  </div>
                ) : null}
                {hasMoreMembers ? <button className="secondary-action" type="button" disabled={loadingMoreMembers} onClick={onLoadMoreMembers}>{loadingMoreMembers ? 'Loading…' : 'Load more members'}</button> : null}
              </div>
              {permissions.has('manage_members') ? (
                <section className="ban-list">
                  <h3>Bans</h3>
                  {(bans.data?.pages.flatMap((page) => page.items) ?? []).map((ban) => (
                    <article key={ban.id}>
                      <span>
                        <strong>{ban.expand?.user?.displayName ?? ban.user}</strong>
                        <small>{ban.reason || 'No reason'}</small>
                      </span>
                      <button type="button" onClick={() => void unban(ban)}>Unban</button>
                    </article>
                  ))}
                  {bans.isLoading ? <p>Loading bans…</p> : null}
                  {bans.isError ? <DataFailure error={bans.error} onRetry={() => void bans.refetch()} label="Could not load bans." /> : null}
                  {bans.hasNextPage ? <button className="secondary-action" type="button" disabled={bans.isFetchingNextPage} onClick={() => void bans.fetchNextPage()}>{bans.isFetchingNextPage ? 'Loading…' : 'Load more bans'}</button> : null}
                  {!bans.isLoading && !bans.data?.pages[0]?.items.length ? <p>No banned members.</p> : null}
                </section>
              ) : null}
            </>
          ) : null}
          {tab === 'audit' ? (
            <div className="audit-list">
              {(audit.data?.pages.flatMap((page) => page.items) ?? []).map((event) => (
                <article key={event.id} title={String(event.targetId)}>
                  <span>
                    <strong>{String(event.action).replace(/\./g, ' ')}</strong>
                    <small>
                      {event.expand?.actor?.displayName ?? 'System'} · {formatTime(String(event.created))}
                      {event.reason ? ` · ${String(event.reason)}` : ''}
                    </small>
                  </span>
                  <code>{String(event.targetType || 'event')}</code>
                </article>
              ))}
              {audit.isLoading ? <p>Loading audit log…</p> : null}
              {audit.hasNextPage ? <button className="secondary-action" type="button" disabled={audit.isFetchingNextPage} onClick={() => void audit.fetchNextPage()}>{audit.isFetchingNextPage ? 'Loading…' : 'Load older events'}</button> : null}
            </div>
          ) : null}
        </div>
      </section>
    </div>,
    document.body,
  )
}
