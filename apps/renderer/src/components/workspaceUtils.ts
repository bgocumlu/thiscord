import type { User } from '@thiscord/shared'
import type { PresenceRecord } from '../features/members/api'

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
})
const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || '?'
}

export function formatTime(value: string) {
  const date = new Date(value)
  const today = new Date()
  return (date.toDateString() === today.toDateString() ? timeFormatter : dateTimeFormatter).format(date)
}

export function resolvedPresence(userId: string, presence: PresenceRecord[]): User['status'] {
  const active = presence.filter((item) => item.user === userId)
  if (active.some((item) => item.status === 'dnd')) return 'dnd'
  if (active.some((item) => item.status === 'online')) return 'online'
  if (active.some((item) => item.status === 'idle')) return 'idle'
  return 'offline'
}
