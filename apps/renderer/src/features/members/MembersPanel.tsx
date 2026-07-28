import type { Membership, Role, User } from '@thiscord/shared'
import { DataFailure, resolvedPresence } from '../../components/WorkspacePrimitives'
import type { PresenceRecord } from './api'
import { Avatar } from './Avatar'

export function MembersPanel({
  memberships,
  presence,
  roles,
  memberRoles,
  onOpenMember,
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
  readonly onOpenMember: (user: User) => void
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
  const sorted = [...memberships].sort((left, right) => {
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
                <button
                  className={`member-row ${status === 'offline' ? 'offline' : ''}`}
                  type="button"
                  onClick={() => onOpenMember(user)}
                  key={membership.id}
                >
                  <Avatar user={user} status={status} />
                  <span>
                    <strong style={highestRole?.color ? { color: highestRole.color } : undefined}>
                      {membership.nickname || user.displayName}
                    </strong>
                    <small>{user.customStatus || `@${user.handle}`}</small>
                  </span>
                </button>
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
