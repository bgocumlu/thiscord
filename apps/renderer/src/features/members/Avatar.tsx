import type { User } from '@thiscord/shared'
import type { RecordModel } from 'pocketbase'
import type { CSSProperties } from 'react'
import { usePocketBase } from '../../lib/contexts'
import { avatarColor } from './avatarColor'

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || '?'
}

const presenceLabels: Record<string, string> = {
  online: 'Online',
  idle: 'Idle',
  dnd: 'Do not disturb',
  offline: 'Offline',
}

export function Avatar({
  user,
  size = 'medium',
  status,
}: {
  readonly user: User
  readonly size?: 'small' | 'medium' | 'hero'
  readonly status?: string
}) {
  const client = usePocketBase()
  const url = user.avatar
    ? client.files.getURL(user as unknown as RecordModel, user.avatar, { thumb: '128x128' })
    : ''
  const color = avatarColor(user.id)
  return (
    <span
      className={`avatar avatar-${size}`}
      style={{ '--avatar-color': color } as CSSProperties}
      aria-hidden={status ? undefined : true}
    >
      {url ? (
        <img
          src={url}
          alt=""
          width="128"
          height="128"
          loading="lazy"
          decoding="async"
        />
      ) : <span aria-hidden="true">{initials(user.displayName || user.handle)}</span>}
      {status ? (
        <span
          className={`presence-dot presence-${status}`}
          role="img"
          aria-label={presenceLabels[status] ?? status}
          title={presenceLabels[status] ?? status}
        />
      ) : null}
    </span>
  )
}
