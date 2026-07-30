export const defaultLocale = 'en'
export const supportedLocales = [defaultLocale, 'tr'] as const
export const localePreferenceStorageKey = 'thiscord.locale.v1'

export type SupportedLocale = (typeof supportedLocales)[number]
export type LocalePreference = SupportedLocale | 'auto'

export function browserLocaleStorage(): Storage | undefined {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

function browserLanguages() {
  try {
    const languages = globalThis.navigator?.languages
    if (languages?.length) return languages
    return globalThis.navigator?.language ? [globalThis.navigator.language] : []
  } catch {
    return []
  }
}

function baseLocale(locale: string) {
  return locale.trim().replace('_', '-').split('-')[0]?.toLowerCase() ?? ''
}

export function isSupportedLocale(locale: string): locale is SupportedLocale {
  return supportedLocales.includes(locale as SupportedLocale)
}

export function readLocalePreference(
  storage: Pick<Storage, 'getItem'> | undefined,
): LocalePreference {
  if (!storage) return 'auto'
  try {
    const value = storage.getItem(localePreferenceStorageKey)
    if (!value || value === 'auto') return 'auto'
    const candidate = baseLocale(value)
    return isSupportedLocale(candidate) ? candidate : 'auto'
  } catch {
    return 'auto'
  }
}

export function writeLocalePreference(
  preference: LocalePreference,
  storage: Pick<Storage, 'setItem' | 'removeItem'> | undefined,
) {
  if (!storage) return
  try {
    if (preference === 'auto') {
      storage.removeItem(localePreferenceStorageKey)
    } else {
      storage.setItem(localePreferenceStorageKey, preference)
    }
  } catch {
    // A blocked storage API should not prevent the application from starting.
  }
}

export function resolveLocale(
  preference: LocalePreference,
  detectedLocales: readonly string[],
): SupportedLocale {
  if (preference !== 'auto') return preference
  for (const locale of detectedLocales) {
    const candidate = baseLocale(locale)
    if (isSupportedLocale(candidate)) return candidate
  }
  return defaultLocale
}

export function detectLocale(
  storage: Pick<Storage, 'getItem'> | undefined = browserLocaleStorage(),
  languages: readonly string[] = browserLanguages(),
) {
  return resolveLocale(readLocalePreference(storage), languages)
}
