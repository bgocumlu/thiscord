import type { User } from '@thiscord/shared'
import type { RecordModel } from 'pocketbase'
import type { CSSProperties } from 'react'
import { usePocketBase } from '../../lib/contexts'
import { t } from '../../lib/i18n'
import { avatarColor } from './avatarColor'

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || '?'
}

const presenceLabelKeys = {
  online: 'presence.online',
  idle: 'presence.idle',
  dnd: 'presence.doNotDisturb',
  offline: 'presence.offline',
} as const

function presenceLabel(status: string) {
  return status in presenceLabelKeys
    ? t(presenceLabelKeys[status as keyof typeof presenceLabelKeys])
    : t("presence.unknown")
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
          aria-label={presenceLabel(status)}
          title={presenceLabel(status)}
        />
      ) : null}
    </span>
  )
}
