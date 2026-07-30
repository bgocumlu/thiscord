import assert from 'node:assert/strict'
import test from 'node:test'
import {
  defaultLocale,
  isSupportedLocale,
  localeMetadata,
  localePreferenceStorageKey,
  readLocalePreference,
  resolveLocale,
  supportedLocales,
  writeLocalePreference,
} from '../src/lib/locale.ts'

function memoryStorage(initialValue = null) {
  const values = new Map(
    initialValue === null ? [] : [[localePreferenceStorageKey, initialValue]],
  )
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    values,
  }
}

test('locale resolution uses every supported local override', () => {
  for (const locale of supportedLocales) {
    assert.equal(resolveLocale(locale, ['en-GB']), locale)
  }
})

test('automatic locale detection resolves supported regional variants in order', () => {
  assert.equal(resolveLocale('auto', ['fr-CA', 'de-DE']), 'fr')
  assert.equal(resolveLocale('auto', ['pt-PT', 'en-GB']), 'pt-BR')
  assert.equal(resolveLocale('auto', ['ja-JP', 'en-GB']), 'ja')
})

test('the supported-locale type guard accepts canonical locale identifiers only', () => {
  for (const locale of supportedLocales) {
    assert.equal(isSupportedLocale(locale), true)
    assert.ok(localeMetadata[locale].nativeName)
  }
  assert.equal(isSupportedLocale('en-US'), false)
  assert.equal(isSupportedLocale('tr-TR'), false)
  assert.equal(isSupportedLocale('pt-br'), false)
})

test('automatic locale detection falls back when no detected locale is supported', () => {
  assert.equal(resolveLocale('auto', ['zh-CN', 'it-IT']), defaultLocale)
})

test('locale preferences stay local, normalize regional values, and reject invalid values', () => {
  assert.equal(readLocalePreference(memoryStorage('tr-TR')), 'tr')
  assert.equal(readLocalePreference(memoryStorage('pt_br')), 'pt-BR')
  assert.equal(readLocalePreference(memoryStorage('de-DE')), 'de')
  assert.equal(readLocalePreference(memoryStorage('not-a-locale')), 'auto')

  const storage = memoryStorage()
  writeLocalePreference('pt-BR', storage)
  assert.equal(storage.values.get(localePreferenceStorageKey), 'pt-BR')
  writeLocalePreference('auto', storage)
  assert.equal(storage.values.has(localePreferenceStorageKey), false)
})
