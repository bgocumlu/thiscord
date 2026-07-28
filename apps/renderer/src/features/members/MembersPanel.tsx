import type {
  Membership,
  Role,
  User,
} from '@thiscord/shared'
import { MoreVertical } from 'lucide-react'
import { useState } from 'react'
import { DataFailure } from '../../components/WorkspacePrimitives'
import { resolvedPresence } from '../../components/workspaceUtils'
import {
  ContextMenu,
  type ContextMenuPoint,
} from '../../components/ContextMenu'
import { keyboardContextMenuPoint } from '../../components/contextMenuPosition'
import type { PresenceRecord } from './api'
import { Avatar } from './Avatar'
import { MemberContextMenuItems } from './MemberContextMenuItems'
import type { MemberInteractions } from './memberInteractions'

function MemberRow({
  membership,
  status,
  highestRole,
  interactions,
}: {
  readonly membership: Membership
  readonly status: ReturnType<typeof resolvedPresence>
  readonly highestRole?: Role
  readonly interactions: MemberInteractions
}) {
  const [menuPoint, setMenuPoint] = useState<ContextMenuPoint | null>(null)
  const user = membership.expand?.user
  if (!user) return null
  const canModerateHierarchy = Boolean(interactions.canModerateUser?.(user.id))
  const openAt = (point: ContextMenuPoint) => setMenuPoint(point)

  return (
    <div className="member-row-wrap">
      <button
        className={`member-row ${status === 'offline' ? 'offline' : ''}`}
        type="button"
        onClick={() => {
          if (user.id === interactions.currentUserId) interactions.onOpenProfile(user)
          else interactions.onMessage(user)
        }}
        onContextMenu={(event) => {
          event.preventDefault()
          openAt({ x: event.clientX, y: event.clientY })
        }}
        onKeyDown={(event) => {
          const point = keyboardContextMenuPoint(event)
          if (point) openAt(point)
        }}
      >
        <Avatar user={user} status={status} />
        <span>
          <strong style={highestRole?.color ? { color: highestRole.color } : undefined}>
            {membership.nickname || user.displayName}
          </strong>
          <small>{user.customStatus || `@${user.handle}`}</small>
        </span>
      </button>
      <button
        className="member-context-trigger"
        type="button"
        title={`More actions for ${membership.nickname || user.displayName}`}
        aria-label={`More actions for ${membership.nickname || user.displayName}`}
        onClick={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect()
          openAt({ x: bounds.right, y: bounds.bottom })
        }}
      ><MoreVertical size={15} /></button>
      {menuPoint ? (
        <ContextMenu
          point={menuPoint}
          label={`Actions for ${membership.nickname || user.displayName}`}
          onClose={() => setMenuPoint(null)}
        >
          <MemberContextMenuItems
            user={user}
            membership={membership}
            currentUserId={interactions.currentUserId}
            onOpenProfile={() => interactions.onOpenProfile(user)}
            onMessage={() => interactions.onMessage(user)}
            communityModeration={
              interactions.canManageMembers
              && canModerateHierarchy
              && interactions.onModerate
                ? {
                    onAction: (action) => interactions.onModerate?.(membership, action),
                  }
                : undefined
            }
          />
        </ContextMenu>
      ) : null}
    </div>
  )
}

export function MembersPanel({
  memberships,
  presence,
  roles,
  memberRoles,
  interactions,
  hasMore,
  loadingMore,
  onLoadMore,
  error,
  onRetry,
}: {
  readonly memberships: Membership[]
  readonly presence: PresenceRecord[]
  readonly roles: Role[]
  readonly memberRoles: readonly { membership: string; role: string }[]
  readonly interactions: MemberInteractions
  readonly hasMore: boolean
  readonly loadingMore: boolean
  readonly onLoadMore: () => void
  readonly error?: unknown
  readonly onRetry?: () => void
}) {
  if (error) {
    return (
      <aside className="members-panel">
        <DataFailure error={error} onRetry={onRetry ?? (() => undefined)} label="Could not load members." />
      </aside>
    )
  }
  const statusFor = (user: User) => resolvedPresence(user.id, presence)
  const sorted = memberships.toSorted((left, right) => {
    const leftStatus = left.expand?.user ? statusFor(left.expand.user) : 'offline'
    const rightStatus = right.expand?.user ? statusFor(right.expand.user) : 'offline'
    return Number(rightStatus !== 'offline') - Number(leftStatus !== 'offline')
  })
  const roleFor = (membership: Membership, hoistOnly = false) => roles
    .filter((role) => (
      (!hoistOnly || role.hoist)
      && memberRoles.some((item) => item.membership === membership.id && item.role === role.id)
    ))
    .sort((left, right) => right.position - left.position)[0]
  const hoistedRoles = roles
    .filter((role) => role.hoist && !role.managed)
    .sort((left, right) => right.position - left.position)
  const groupedIds = new Set<string>()
  const groups: Array<{ label: string; items: Membership[]; role?: Role }> = []
  for (const role of hoistedRoles) {
    const items = sorted.filter((membership) => {
      if (groupedIds.has(membership.id) || roleFor(membership, true)?.id !== role.id) return false
      groupedIds.add(membership.id)
      return true
    })
    if (items.length) groups.push({ label: role.name, items, role })
  }
  const remaining = sorted.filter((membership) => !groupedIds.has(membership.id))
  groups.push(
    {
      label: 'Online',
      items: remaining.filter((membership) => (
        membership.expand?.user && statusFor(membership.expand.user) !== 'offline'
      )),
    },
    {
      label: 'Offline',
      items: remaining.filter((membership) => (
        membership.expand?.user && statusFor(membership.expand.user) === 'offline'
      )),
    },
  )
  const onlineCount = sorted.filter((membership) => (
    membership.expand?.user && statusFor(membership.expand.user) !== 'offline'
  )).length

  return (
    <aside className="members-panel">
      <div className="members-summary">
        <div>
          <strong>Members</strong>
          <small>
            {memberships.length}{hasMore ? '+' : ''} member{memberships.length === 1 ? '' : 's'}
            {' · '}{onlineCount} online{hasMore ? ' shown' : ''}
          </small>
        </div>
      </div>
      <div className="members-scroll">
        {groups.map((group) => (
          <section className="member-group" key={group.label}>
            <h3 style={group.role?.color ? { color: group.role.color } : undefined}>
              {group.label} — {group.items.length}
            </h3>
            {group.items.map((membership) => {
              const user = membership.expand?.user
              if (!user) return null
              const status = statusFor(user)
              const highestRole = roleFor(membership)
              return (
                <MemberRow
                  membership={membership}
                  status={status}
                  highestRole={highestRole}
                  interactions={interactions}
                  key={membership.id}
                />
              )
            })}
          </section>
        ))}
        {hasMore ? (
          <button
            className="secondary-action members-load-more"
            type="button"
            disabled={loadingMore}
            onClick={onLoadMore}
          >{loadingMore ? 'Loading…' : 'Load more members'}</button>
        ) : null}
      </div>
    </aside>
  )
}
