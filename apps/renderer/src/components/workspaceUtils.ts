import type { User } from '@thiscord/shared'
import type { PresenceRecord } from '../features/members/api'
import { i18nInstance } from '../lib/i18n'
import {
  defaultLocale,
  isSupportedLocale,
  supportedLocales,
  type SupportedLocale,
} from '../lib/locale'

function dateTimeFormatters(options: Intl.DateTimeFormatOptions) {
  return Object.fromEntries(supportedLocales.map((locale) => [
    locale,
    Intl.DateTimeFormat(locale, options),
  ])) as Record<SupportedLocale, Intl.DateTimeFormat>
}

const timeFormatters = dateTimeFormatters({
  hour: '2-digit',
  minute: '2-digit',
})

const dateAndTimeFormatters = dateTimeFormatters({
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

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
    : dateAndTimeFormatters[locale]).format(date)
}

export function resolvedPresence(userId: string, presence: PresenceRecord[]): User['status'] {
  const active = presence.filter((item) => item.user === userId)
  if (active.some((item) => item.status === 'dnd')) return 'dnd'
  if (active.some((item) => item.status === 'online')) return 'online'
  if (active.some((item) => item.status === 'idle')) return 'idle'
  return 'offline'
}
