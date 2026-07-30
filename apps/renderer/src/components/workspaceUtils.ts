import type { User } from '@thiscord/shared'
import type { PresenceRecord } from '../features/members/api'
import { i18nInstance } from '../lib/i18n'
import {
  defaultLocale,
  isSupportedLocale,
  type SupportedLocale,
} from '../lib/locale'

const timeFormatters = {
  en: new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
  }),
  tr: new Intl.DateTimeFormat('tr', {
    hour: '2-digit',
    minute: '2-digit',
  }),
} satisfies Record<SupportedLocale, Intl.DateTimeFormat>

const dateTimeFormatters = {
  en: new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }),
  tr: new Intl.DateTimeFormat('tr', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }),
} satisfies Record<SupportedLocale, Intl.DateTimeFormat>

function activeLocale() {
  const locale = i18nInstance.resolvedLanguage ?? defaultLocale
  return isSupportedLocale(locale) ? locale : defaultLocale
}

export function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || '?'
}

export function formatTime(value: string) {
  const date = new Date(value)
  const today = new Date()
  const locale = activeLocale()
  return (date.toDateString() === today.toDateString()
    ? timeFormatters[locale]
    : dateTimeFormatters[locale]).format(date)
}

export function resolvedPresence(userId: string, presence: PresenceRecord[]): User['status'] {
  const active = presence.filter((item) => item.user === userId)
  if (active.some((item) => item.status === 'dnd')) return 'dnd'
  if (active.some((item) => item.status === 'online')) return 'online'
  if (active.some((item) => item.status === 'idle')) return 'idle'
  return 'offline'
}
