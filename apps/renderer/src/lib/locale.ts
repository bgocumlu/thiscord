export const defaultLocale = 'en'
export const supportedLocales = [
  defaultLocale,
  'de',
  'es',
  'fr',
  'ja',
  'pt-BR',
  'ru',
  'tr',
] as const
export const localePreferenceStorageKey = 'thiscord.locale.v1'

export type SupportedLocale = (typeof supportedLocales)[number]
export type LocalePreference = SupportedLocale | 'auto'

export const localeMetadata = {
  en: { nativeName: 'English' },
  de: { nativeName: 'Deutsch' },
  es: { nativeName: 'Español' },
  fr: { nativeName: 'Français' },
  ja: { nativeName: '日本語' },
  'pt-BR': { nativeName: 'Português (Brasil)' },
  ru: { nativeName: 'Русский' },
  tr: { nativeName: 'Türkçe' },
} satisfies Record<SupportedLocale, { readonly nativeName: string }>

const baseLocaleDefaults: Readonly<Record<string, SupportedLocale>> = {
  pt: 'pt-BR',
}

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

function canonicalLocale(locale: string) {
  try {
    return Intl.getCanonicalLocales(locale.trim().replaceAll('_', '-'))[0] ?? ''
  } catch {
    return ''
  }
}

function matchSupportedLocale(locale: string): SupportedLocale | undefined {
  const canonical = canonicalLocale(locale)
  if (!canonical) return undefined
  if (isSupportedLocale(canonical)) return canonical
  const base = canonical.split('-')[0]?.toLowerCase() ?? ''
  if (isSupportedLocale(base)) return base
  return baseLocaleDefaults[base]
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
    return matchSupportedLocale(value) ?? 'auto'
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
    const candidate = matchSupportedLocale(locale)
    if (candidate) return candidate
  }
  return defaultLocale
}

export function detectLocale(
  storage: Pick<Storage, 'getItem'> | undefined = browserLocaleStorage(),
  languages: readonly string[] = browserLanguages(),
) {
  return resolveLocale(readLocalePreference(storage), languages)
}
