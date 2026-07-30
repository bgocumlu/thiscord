import { createInstance } from 'i18next'
import { useSyncExternalStore } from 'react'
import en from '../locales/en/translation.json'
import {
  browserLocaleStorage,
  defaultLocale,
  detectLocale,
  supportedLocales,
  writeLocalePreference,
  type LocalePreference,
  type SupportedLocale,
} from './locale'

export const i18nInstance = createInstance()

const localeLoaders = {
  en: async () => en,
  tr: async () => (await import('../locales/tr/translation.json')).default,
} satisfies Record<SupportedLocale, () => Promise<typeof en>>

void i18nInstance.init({
  resources: { en: { translation: en } },
  lng: defaultLocale,
  fallbackLng: defaultLocale,
  supportedLngs: [...supportedLocales],
  load: 'languageOnly',
  initAsync: false,
  keySeparator: '.',
  nsSeparator: ':',
  returnNull: false,
  returnEmptyString: false,
  interpolation: {
    // React escapes rendered text; escaping here would display HTML entities.
    escapeValue: false,
  },
})

export const t = i18nInstance.t

async function loadLocale(locale: SupportedLocale) {
  if (i18nInstance.hasResourceBundle(locale, 'translation')) return locale
  try {
    const resource = await localeLoaders[locale]()
    i18nInstance.addResourceBundle(locale, 'translation', resource, true, true)
    return locale
  } catch {
    return defaultLocale
  }
}

export function applyDocumentLocale(
  locale = i18nInstance.resolvedLanguage ?? defaultLocale,
) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = locale
  document.documentElement.dir = i18nInstance.dir(locale)
}

async function applyDetectedLocale() {
  const nextLocale = await loadLocale(detectLocale())
  if (nextLocale === i18nInstance.resolvedLanguage) return
  await i18nInstance.changeLanguage(nextLocale)
}

export async function initializeLocale() {
  await applyDetectedLocale()
  applyDocumentLocale()
}

export async function setLocalePreference(preference: LocalePreference) {
  writeLocalePreference(preference, browserLocaleStorage())
  await applyDetectedLocale()
}

function subscribeToLocale(onStoreChange: () => void) {
  i18nInstance.on('languageChanged', onStoreChange)
  return () => {
    i18nInstance.off('languageChanged', onStoreChange)
  }
}

function localeSnapshot() {
  return i18nInstance.resolvedLanguage ?? defaultLocale
}

export function useLocale() {
  return useSyncExternalStore(subscribeToLocale, localeSnapshot, () => defaultLocale)
}

globalThis.addEventListener?.('languagechange', () => {
  void applyDetectedLocale()
})
i18nInstance.on('languageChanged', applyDocumentLocale)
applyDocumentLocale()
