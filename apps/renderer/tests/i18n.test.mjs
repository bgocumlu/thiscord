import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'
import {
  applyDocumentLocale,
  i18nInstance,
  initializeLocale,
  setLocalePreference,
  t,
} from '../src/lib/i18n.ts'
import { localePreferenceStorageKey } from '../src/lib/locale.ts'

test('i18next initializes English synchronously as the supported fallback locale', () => {
  assert.equal(i18nInstance.isInitialized, true)
  assert.equal(i18nInstance.resolvedLanguage, 'en')
  assert.equal(t('members.profileDialogs.saveChanges'), 'Save changes')
})

test('English translations handle plural-sensitive interface copy', () => {
  assert.equal(t('common.memberCount', { count: 1 }), '1 member')
  assert.equal(t('common.memberCount', { count: 3 }), '3 members')
  assert.equal(t('search.resultCount', { count: 1 }), '1 search result.')
  assert.equal(t('search.resultCount', { count: 0 }), '0 search results.')
})

test('English translations interpolate dynamic content', () => {
  assert.equal(
    t('app.openName', { name: 'Thiscord' }),
    'Open Thiscord',
  )
})

test('English translations preserve the original interface wording', () => {
  assert.equal(
    t('auth.screen.handleRequirements'),
    '2–32 letters, numbers, periods, dashes, or underscores.',
  )
  assert.equal(t('calls.surface.voiceConnected'), 'Voice connected')
  assert.equal(t('calls.surface.voiceConnectedDock'), 'Voice Connected')
  assert.equal(t('members.contextMenuItems.removeTimeout'), 'Remove Timeout')
})

test('Turkish loads on demand with interpolation and local-only preference storage', async () => {
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  const values = new Map()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    },
  })
  try {
    await setLocalePreference('tr')
    assert.equal(i18nInstance.resolvedLanguage, 'tr')
    assert.equal(t('members.profileDialogs.saveChanges'), 'Değişiklikleri kaydet')
    assert.equal(t('common.memberCount', { count: 3 }), '3 üye')
    assert.equal(t('app.openName', { name: 'Thiscord' }), "Thiscord'yi aç")
    assert.equal(values.get(localePreferenceStorageKey), 'tr')
  } finally {
    await setLocalePreference('en')
    if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage)
    else delete globalThis.localStorage
  }
})

test('stable nested keys resolve through the complete source catalog', () => {
  assert.equal(t('workspace.chrome.helpAndTips'), 'Help and tips')
})

test('locale initialization and document metadata use the resolved language', async () => {
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
  const documentElement = { dir: '', lang: '' }
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { documentElement },
  })
  try {
    await initializeLocale()
    applyDocumentLocale()
    assert.equal(documentElement.lang, 'en')
    assert.equal(documentElement.dir, 'ltr')
  } finally {
    if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument)
    else delete globalThis.document
  }
})

test('the source catalog contains complete English values', async () => {
  const catalog = JSON.parse(await readFile(
    new URL('../src/locales/en/translation.json', import.meta.url),
    'utf8',
  ))
  const entries = flattenCatalog(catalog)

  assert.ok(entries.length > 700)
  for (const [key, value] of entries) {
    assert.equal(typeof value, 'string', `${key} must resolve to a string`)
    assert.notEqual(value.trim(), '', `${key} must have an English value`)
    assert.notEqual(value, key, `${key} must not fall back to its key`)
  }
})

test('production JSX does not bypass the translation catalog with literal copy', async () => {
  const sourceDirectory = new URL('../src/', import.meta.url)
  const paths = (await readdir(sourceDirectory, {
    recursive: true,
    withFileTypes: true,
  }))
    .filter((entry) => entry.isFile() && entry.name.endsWith('.tsx'))
    .map((entry) => pathToFileURL(join(entry.parentPath, entry.name)))
    .filter((url) => !url.pathname.includes('/testing/'))

  const violations = []
  for (const url of paths) {
    const content = await readFile(url, 'utf8')
    const sourceFile = ts.createSourceFile(
      url.pathname,
      content,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    )
    visit(sourceFile, (node) => {
      if (ts.isJsxText(node) && /[A-Za-z]/.test(node.text)) {
        violations.push(`${url.pathname}:${sourceFile.getLineAndCharacterOfPosition(node.pos).line + 1}`)
      }
      if (
        ts.isJsxAttribute(node)
        && ['alt', 'aria-label', 'placeholder', 'title'].includes(node.name.getText(sourceFile))
        && node.initializer
        && ts.isStringLiteral(node.initializer)
        && /[A-Za-z]/.test(node.initializer.text)
      ) {
        violations.push(`${url.pathname}:${sourceFile.getLineAndCharacterOfPosition(node.pos).line + 1}`)
      }
    })
  }

  assert.deepEqual(violations, [])
})

function flattenCatalog(value, prefix = '') {
  return Object.entries(value).flatMap(([key, child]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key
    return typeof child === 'object' && child !== null
      ? flattenCatalog(child, fullKey)
      : [[fullKey, child]]
  })
}

function visit(node, check) {
  check(node)
  node.forEachChild((child) => visit(child, check))
}
