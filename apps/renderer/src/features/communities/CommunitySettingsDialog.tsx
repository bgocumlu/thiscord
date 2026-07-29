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
import { useRef, useState, type FormEvent, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import {
  DataFailure,
  ImageFileField,
} from '../../components/WorkspacePrimitives'
import { formatTime } from '../../components/workspaceUtils'
import { useDialogAccessibility } from '../../hooks/useDialogAccessibility'
import { useConfirmation } from '../../hooks/useConfirmation'
import { usePocketBase, useRuntimeConfig } from '../../lib/contexts'
import { errorMessage } from '../../lib/pocketbase'
import { MemberAdminRow } from '../members/MemberAdministration'
import { RoleSettings } from '../roles/RoleSettings'
import { communityApi, type BanRecord } from './api'
import { communityKeys } from './queryKeys'

type SettingsTab = 'general' | 'invites' | 'roles' | 'members' | 'audit'
type AuditEvent = RecordModel & { readonly expand?: { readonly actor?: User } }

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
  const [tab, setTab] = useState<SettingsTab>('general')
  const [memberSearch, setMemberSearch] = useState('')
  const dialogRef = useRef<HTMLDialogElement>(null)
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
  const {
    busy,
    error,
    notice,
    confirmation,
    clearFeedback,
    saveGeneral,
    createInvite,
    copyInvite,
    revokeInvite,
    unban,
    deleteCommunity,
    leaveCommunity,
    transferOwnership,
  } = useCommunitySettingsActions({
    community,
    onChanged,
    onDeleted,
    onBansChanged: () => bans.refetch(),
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
    roles.flatMap((role) => role.permissions.includes('administrator') ? [role.id] : []),
  )
  const transferCandidates = memberships.filter((membership) => (
    membership.user !== currentUser.id
    && membership.expand?.user
    && memberRoles.some((assignment) => (
      assignment.membership === membership.id && administratorRoleIds.has(assignment.role)
    ))
  ))

  return (
    <>
      <CommunitySettingsView
      dialogRef={dialogRef}
      community={community}
      roles={roles}
      memberships={memberships}
      filteredMemberships={filteredMemberships}
      currentUser={currentUser}
      permissions={permissions}
      highestRolePosition={highestRolePosition}
      owner={owner}
      tab={tab}
      availableTabs={availableTabs}
      error={error}
      notice={notice}
      iconUrl={iconUrl}
      bannerUrl={bannerUrl}
      busy={busy}
      memberSearch={memberSearch}
      transferCandidates={transferCandidates}
      memberPagination={{ hasMore: hasMoreMembers, loadingMore: loadingMoreMembers }}
      invites={invites.data?.pages.flatMap((page) => page.items) ?? []}
      inviteState={{
        loading: invites.isLoading,
        hasMore: invites.hasNextPage,
        loadingMore: invites.isFetchingNextPage,
      }}
      bans={bans.data?.pages.flatMap((page) => page.items) ?? []}
      banState={{
        loading: bans.isLoading,
        error: bans.isError ? bans.error : undefined,
        hasMore: bans.hasNextPage,
        loadingMore: bans.isFetchingNextPage,
      }}
      auditEvents={audit.data?.pages.flatMap((page) => page.items) ?? []}
      auditState={{
        loading: audit.isLoading,
        hasMore: audit.hasNextPage,
        loadingMore: audit.isFetchingNextPage,
      }}
      onTabChange={(nextTab) => {
        setTab(nextTab)
        clearFeedback()
      }}
      onClose={onClose}
      onSave={saveGeneral}
      onTransfer={transferOwnership}
      onLoadMoreMembers={onLoadMoreMembers}
      onDelete={deleteCommunity}
      onLeave={leaveCommunity}
      onCreateInvite={createInvite}
      onCopyInvite={copyInvite}
      onRevokeInvite={revokeInvite}
      onLoadMoreInvites={() => void invites.fetchNextPage()}
      onSearchChange={setMemberSearch}
      onChanged={onChanged}
      onUnban={unban}
      onRetryBans={() => void bans.refetch()}
      onLoadMoreBans={() => void bans.fetchNextPage()}
        onLoadMoreAudit={() => void audit.fetchNextPage()}
      />
      {confirmation}
    </>
  )
}

function useCommunitySettingsActions({
  community,
  onChanged,
  onDeleted,
  onBansChanged,
}: {
  readonly community: Community
  readonly onChanged: () => Promise<void>
  readonly onDeleted: () => void
  readonly onBansChanged: () => Promise<unknown>
}) {
  const client = usePocketBase()
  const config = useRuntimeConfig()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const { confirm, confirmation } = useConfirmation()
  const clearFeedback = () => {
    setError('')
    setNotice('')
  }
  const saveGeneral = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    clearFeedback()
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
    clearFeedback()
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
    if (!await confirm({
      title: 'Revoke invite?',
      description: `Revoke invite ${invite.code}? Anyone who has not used it will no longer be able to join.`,
      confirmLabel: 'Revoke invite',
    })) return
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
    const displayName = ban.expand?.user?.displayName ?? 'this member'
    if (!await confirm({
      title: 'Remove ban?',
      description: `Unban ${displayName}? They will be able to rejoin with a valid invite.`,
      confirmLabel: 'Remove ban',
    })) return
    setError('')
    try {
      await communityApi.unban(client, ban.id)
      await onBansChanged()
      setNotice(`${ban.expand?.user?.displayName ?? 'Member'} was unbanned.`)
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }
  const deleteCommunity = async () => {
    if (
      busy
      || !await confirm({
        title: 'Permanently delete community?',
        description: `Delete ${community.name}, its channels, memberships, messages, and call history? This cannot be undone.`,
        confirmLabel: 'Delete community permanently',
      })
    ) return
    setBusy(true)
    try {
      await communityApi.remove(client, community.id)
      onDeleted()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }
  const leaveCommunity = async () => {
    if (busy || !await confirm({
      title: 'Leave community?',
      description: `Leave ${community.name}? You will need another valid invite to return.`,
      confirmLabel: 'Leave community',
    })) return
    setBusy(true)
    setError('')
    try {
      await communityApi.leave(client, community.id)
      onDeleted()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }
  const transferOwnership = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (
      busy
      || !await confirm({
        title: 'Transfer ownership?',
        description: 'This gives another member final control of the community and cannot be reversed without their cooperation.',
        confirmLabel: 'Transfer ownership',
      })
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

  return {
    busy,
    error,
    notice,
    confirmation,
    clearFeedback,
    saveGeneral,
    createInvite,
    copyInvite,
    revokeInvite,
    unban,
    deleteCommunity,
    leaveCommunity,
    transferOwnership,
  }
}

function CommunitySettingsView({
  dialogRef,
  community,
  roles,
  memberships,
  filteredMemberships,
  currentUser,
  permissions,
  highestRolePosition,
  owner,
  tab,
  availableTabs,
  error,
  notice,
  iconUrl,
  bannerUrl,
  busy,
  memberSearch,
  transferCandidates,
  memberPagination,
  invites,
  inviteState,
  bans,
  banState,
  auditEvents,
  auditState,
  onTabChange,
  onClose,
  onSave,
  onTransfer,
  onLoadMoreMembers,
  onDelete,
  onLeave,
  onCreateInvite,
  onCopyInvite,
  onRevokeInvite,
  onLoadMoreInvites,
  onSearchChange,
  onChanged,
  onUnban,
  onRetryBans,
  onLoadMoreBans,
  onLoadMoreAudit,
}: {
  readonly dialogRef: RefObject<HTMLDialogElement | null>
  readonly community: Community
  readonly roles: Role[]
  readonly memberships: Membership[]
  readonly filteredMemberships: Membership[]
  readonly currentUser: User
  readonly permissions: ReadonlySet<Permission>
  readonly highestRolePosition: number
  readonly owner: boolean
  readonly tab: SettingsTab
  readonly availableTabs: SettingsTab[]
  readonly error: string
  readonly notice: string
  readonly iconUrl: string
  readonly bannerUrl: string
  readonly busy: boolean
  readonly memberSearch: string
  readonly transferCandidates: Membership[]
  readonly memberPagination: { readonly hasMore: boolean; readonly loadingMore: boolean }
  readonly invites: Invite[]
  readonly inviteState: {
    readonly loading: boolean
    readonly hasMore: boolean
    readonly loadingMore: boolean
  }
  readonly bans: BanRecord[]
  readonly banState: {
    readonly loading: boolean
    readonly error: unknown | undefined
    readonly hasMore: boolean
    readonly loadingMore: boolean
  }
  readonly auditEvents: AuditEvent[]
  readonly auditState: {
    readonly loading: boolean
    readonly hasMore: boolean
    readonly loadingMore: boolean
  }
  readonly onTabChange: (tab: SettingsTab) => void
  readonly onClose: () => void
  readonly onSave: (event: FormEvent<HTMLFormElement>) => Promise<void>
  readonly onTransfer: (event: FormEvent<HTMLFormElement>) => Promise<void>
  readonly onLoadMoreMembers: () => void
  readonly onDelete: () => Promise<void>
  readonly onLeave: () => Promise<void>
  readonly onCreateInvite: (event: FormEvent<HTMLFormElement>) => Promise<void>
  readonly onCopyInvite: (invite: Invite) => Promise<void>
  readonly onRevokeInvite: (invite: Invite) => Promise<void>
  readonly onLoadMoreInvites: () => void
  readonly onSearchChange: (value: string) => void
  readonly onChanged: () => Promise<void>
  readonly onUnban: (ban: BanRecord) => Promise<void>
  readonly onRetryBans: () => void
  readonly onLoadMoreBans: () => void
  readonly onLoadMoreAudit: () => void
}) {
  const availableTabSet = new Set(availableTabs)
  return createPortal(
    <dialog ref={dialogRef} className="modal-backdrop" aria-label={`${community.name} settings`}>
      <section className="settings-card">
        <nav className="settings-navigation" aria-label={`${community.name} settings sections`}>
          <strong>{community.name}</strong>
          {([
            { label: 'Community', items: ['general', 'invites'] as const },
            { label: 'People and safety', items: ['roles', 'members', 'audit'] as const },
          ]).map((group) => {
            const items = group.items.filter((item) => availableTabSet.has(item))
            if (!items.length) return null
            return (
              <div className="settings-nav-group" key={group.label}>
                <small>{group.label}</small>
                {items.map((item) => (
                  <button
                    className={tab === item ? 'active' : ''}
                    type="button"
                    aria-current={tab === item ? 'page' : undefined}
                    onClick={() => onTabChange(item)}
                    key={item}
                  >{item}</button>
                ))}
              </div>
            )
          })}
        </nav>
        <div className="settings-content">
          <header>
            <h2>{tab[0].toUpperCase() + tab.slice(1)}</h2>
            <button type="button" aria-label={`Close ${community.name} settings`} onClick={onClose}>
              <X size={18} />
            </button>
          </header>
          {error ? <p className="form-error settings-feedback" role="alert">{error}</p> : null}
          {notice ? <p className="form-notice settings-feedback" role="status">{notice}</p> : null}
          {tab === 'general' ? (
            <GeneralSettings
              community={community}
              currentUser={currentUser}
              canManage={permissions.has('manage_community')}
              iconUrl={iconUrl}
              bannerUrl={bannerUrl}
              busy={busy}
              transferCandidates={transferCandidates}
              hasMoreMembers={memberPagination.hasMore}
              loadingMoreMembers={memberPagination.loadingMore}
              onSave={onSave}
              onTransfer={onTransfer}
              onLoadMoreMembers={onLoadMoreMembers}
              onDelete={onDelete}
              onLeave={onLeave}
            />
          ) : null}
          {tab === 'invites' ? (
            <InviteSettings
              invites={invites}
              busy={busy}
              loading={inviteState.loading}
              hasNextPage={inviteState.hasMore}
              fetchingNextPage={inviteState.loadingMore}
              onCreate={onCreateInvite}
              onCopy={onCopyInvite}
              onRevoke={onRevokeInvite}
              onLoadMore={onLoadMoreInvites}
            />
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
            <MemberSettings
              community={community}
              roles={roles}
              memberships={memberships}
              filteredMemberships={filteredMemberships}
              currentUser={currentUser}
              search={memberSearch}
              capabilities={{
                manageRoles: permissions.has('manage_roles'),
                manageMembers: permissions.has('manage_members'),
              }}
              memberPagination={memberPagination}
              bans={bans}
              banState={banState}
              onSearchChange={onSearchChange}
              onChanged={onChanged}
              onLoadMoreMembers={onLoadMoreMembers}
              onUnban={onUnban}
              onRetryBans={onRetryBans}
              onLoadMoreBans={onLoadMoreBans}
            />
          ) : null}
          {tab === 'audit' ? (
            <AuditSettings
              events={auditEvents}
              loading={auditState.loading}
              hasNextPage={auditState.hasMore}
              fetchingNextPage={auditState.loadingMore}
              onLoadMore={onLoadMoreAudit}
            />
          ) : null}
        </div>
      </section>
    </dialog>,
    document.body,
  )
}

function GeneralSettings({
  community,
  currentUser,
  canManage,
  iconUrl,
  bannerUrl,
  busy,
  transferCandidates,
  hasMoreMembers,
  loadingMoreMembers,
  onSave,
  onTransfer,
  onLoadMoreMembers,
  onDelete,
  onLeave,
}: {
  readonly community: Community
  readonly currentUser: User
  readonly canManage: boolean
  readonly iconUrl: string
  readonly bannerUrl: string
  readonly busy: boolean
  readonly transferCandidates: Membership[]
  readonly hasMoreMembers: boolean
  readonly loadingMoreMembers: boolean
  readonly onSave: (event: FormEvent<HTMLFormElement>) => Promise<void>
  readonly onTransfer: (event: FormEvent<HTMLFormElement>) => Promise<void>
  readonly onLoadMoreMembers: () => void
  readonly onDelete: () => Promise<void>
  readonly onLeave: () => Promise<void>
}) {
  return (
    <>
      {canManage ? (
        <form className="modal-form" onSubmit={(event) => void onSave(event)}>
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
          <form className="modal-form compact-form" onSubmit={(event) => void onTransfer(event)}>
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
            <button className="danger-action" type="button" onClick={() => void onDelete()}>Delete community</button>
          </section>
        </>
      ) : (
        <section className="settings-danger">
          <h3>Leave community</h3>
          <button className="danger-action" type="button" onClick={() => void onLeave()}>Leave community</button>
        </section>
      )}
    </>
  )
}

function InviteSettings({
  invites,
  busy,
  loading,
  hasNextPage,
  fetchingNextPage,
  onCreate,
  onCopy,
  onRevoke,
  onLoadMore,
}: {
  readonly invites: Invite[]
  readonly busy: boolean
  readonly loading: boolean
  readonly hasNextPage: boolean
  readonly fetchingNextPage: boolean
  readonly onCreate: (event: FormEvent<HTMLFormElement>) => Promise<void>
  readonly onCopy: (invite: Invite) => Promise<void>
  readonly onRevoke: (invite: Invite) => Promise<void>
  readonly onLoadMore: () => void
}) {
  return (
    <>
      <form className="modal-form compact-form invite-create-form" onSubmit={(event) => void onCreate(event)}>
        <label><span>Expires after</span><select name="expiresInHours" defaultValue="168"><option value="1">1 hour</option><option value="24">1 day</option><option value="168">7 days</option><option value="720">30 days</option><option value="0">Never</option></select><small>Choose when the invite link expires</small></label>
        <label><span>Maximum uses</span><input name="maxUses" type="number" min="0" defaultValue="0" /><small>0 means unlimited</small></label>
        <button className="primary-action" type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create and copy invite'}</button>
      </form>
      <div className="settings-list">
        {invites.map((invite) => (
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
              <button type="button" onClick={() => void onCopy(invite)}>Copy</button>
              {!invite.revoked ? <button type="button" onClick={() => void onRevoke(invite)}>Revoke</button> : null}
            </div>
          </article>
        ))}
        {loading ? <p>Loading invites…</p> : null}
        {hasNextPage ? <button className="secondary-action" type="button" disabled={fetchingNextPage} onClick={onLoadMore}>{fetchingNextPage ? 'Loading…' : 'Load older invites'}</button> : null}
      </div>
    </>
  )
}

function MemberSettings({
  community,
  roles,
  memberships,
  filteredMemberships,
  currentUser,
  search,
  capabilities,
  memberPagination,
  bans,
  banState,
  onSearchChange,
  onChanged,
  onLoadMoreMembers,
  onUnban,
  onRetryBans,
  onLoadMoreBans,
}: {
  readonly community: Community
  readonly roles: Role[]
  readonly memberships: Membership[]
  readonly filteredMemberships: Membership[]
  readonly currentUser: User
  readonly search: string
  readonly capabilities: {
    readonly manageRoles: boolean
    readonly manageMembers: boolean
  }
  readonly memberPagination: {
    readonly hasMore: boolean
    readonly loadingMore: boolean
  }
  readonly bans: BanRecord[]
  readonly banState: {
    readonly loading: boolean
    readonly error: unknown | undefined
    readonly hasMore: boolean
    readonly loadingMore: boolean
  }
  readonly onSearchChange: (value: string) => void
  readonly onChanged: () => Promise<void>
  readonly onLoadMoreMembers: () => void
  readonly onUnban: (ban: BanRecord) => Promise<void>
  readonly onRetryBans: () => void
  readonly onLoadMoreBans: () => void
}) {
  const normalizedSearch = search.trim().toLowerCase()
  return (
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
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search members"
            aria-label="Search community members"
          />
        </label>
      </div>
      <p className="member-result-count">
        {normalizedSearch
          ? `${filteredMemberships.length} matching loaded members`
          : `${memberships.length}${memberPagination.hasMore ? '+' : ''} members loaded`}
      </p>
      <div className="settings-list member-admin-list">
        {filteredMemberships.map((membership) => (
          <MemberAdminRow
            community={community}
            membership={membership}
            roles={roles}
            currentUser={currentUser}
            canManageRoles={capabilities.manageRoles}
            canManageMembers={capabilities.manageMembers}
            onChanged={onChanged}
            key={membership.id}
          />
        ))}
        {normalizedSearch && !filteredMemberships.length ? (
          <div className="member-search-empty">
            <strong>No matching members</strong>
            <span>Try a display name, nickname, handle, or email address.</span>
          </div>
        ) : null}
        {memberPagination.hasMore ? <button className="secondary-action" type="button" disabled={memberPagination.loadingMore} onClick={onLoadMoreMembers}>{memberPagination.loadingMore ? 'Loading…' : 'Load more members'}</button> : null}
      </div>
      {capabilities.manageMembers ? (
        <section className="ban-list">
          <h3>Bans</h3>
          {bans.map((ban) => (
            <article key={ban.id}>
              <span>
                <strong>{ban.expand?.user?.displayName ?? ban.user}</strong>
                <small>{ban.reason || 'No reason'}</small>
              </span>
              <button type="button" onClick={() => void onUnban(ban)}>Unban</button>
            </article>
          ))}
          {banState.loading ? <p>Loading bans…</p> : null}
          {banState.error ? <DataFailure error={banState.error} onRetry={onRetryBans} label="Could not load bans." /> : null}
          {banState.hasMore ? <button className="secondary-action" type="button" disabled={banState.loadingMore} onClick={onLoadMoreBans}>{banState.loadingMore ? 'Loading…' : 'Load more bans'}</button> : null}
          {!banState.loading && !bans.length ? <p>No banned members.</p> : null}
        </section>
      ) : null}
    </>
  )
}

function AuditSettings({
  events,
  loading,
  hasNextPage,
  fetchingNextPage,
  onLoadMore,
}: {
  readonly events: AuditEvent[]
  readonly loading: boolean
  readonly hasNextPage: boolean
  readonly fetchingNextPage: boolean
  readonly onLoadMore: () => void
}) {
  return (
    <div className="audit-list">
      {events.map((event) => (
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
      {loading ? <p>Loading audit log…</p> : null}
      {hasNextPage ? <button className="secondary-action" type="button" disabled={fetchingNextPage} onClick={onLoadMore}>{fetchingNextPage ? 'Loading…' : 'Load older events'}</button> : null}
    </div>
  )
}
