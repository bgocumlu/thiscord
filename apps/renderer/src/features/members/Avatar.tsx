import type { User } from '@thiscord/shared'
import type { RecordModel } from 'pocketbase'
import type { CSSProperties } from 'react'
import { usePocketBase } from '../../lib/contexts'

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || '?'
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
  const color = `hsl(${[...user.id].reduce((sum, character) => sum + character.charCodeAt(0), 0) % 360} 62% 58%)`
  return (
    <span className={`avatar avatar-${size}`} style={{ '--avatar-color': color } as CSSProperties} aria-label={user.displayName}>
      {url ? <img src={url} alt="" /> : initials(user.displayName || user.handle)}
      {status ? <span className={`presence-dot presence-${status}`} /> : null}
    </span>
  )
}
