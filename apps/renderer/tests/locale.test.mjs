import assert from 'node:assert/strict'
import test from 'node:test'
import {
  defaultLocale,
  isSupportedLocale,
  localePreferenceStorageKey,
  readLocalePreference,
  resolveLocale,
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

test('locale resolution uses a supported local override', () => {
  assert.equal(resolveLocale('tr', ['en-GB']), 'tr')
})

test('automatic locale detection resolves supported regional variants in order', () => {
  assert.equal(resolveLocale('auto', ['tr-TR', 'en-GB']), 'tr')
})

test('the supported-locale type guard accepts canonical locale identifiers only', () => {
  assert.equal(isSupportedLocale('en'), true)
  assert.equal(isSupportedLocale('tr'), true)
  assert.equal(isSupportedLocale('en-US'), false)
  assert.equal(isSupportedLocale('tr-TR'), false)
})

test('automatic locale detection falls back when no detected locale is supported', () => {
  assert.equal(resolveLocale('auto', ['fr-FR', 'de-DE']), defaultLocale)
})

test('locale preferences stay local and invalid values become automatic', () => {
  assert.equal(readLocalePreference(memoryStorage('tr-TR')), 'tr')
  assert.equal(readLocalePreference(memoryStorage('de')), 'auto')

  const storage = memoryStorage()
  writeLocalePreference('tr', storage)
  assert.equal(storage.values.get(localePreferenceStorageKey), 'tr')
  writeLocalePreference('auto', storage)
  assert.equal(storage.values.has(localePreferenceStorageKey), false)
})
