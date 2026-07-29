import assert from 'node:assert/strict'
import test from 'node:test'
import {
  resolveAppearanceTheme,
  themeColorFor,
} from '../src/lib/appearance.ts'

test('appearance resolution follows explicit and system theme choices', () => {
  assert.equal(resolveAppearanceTheme('dark', true), 'dark')
  assert.equal(resolveAppearanceTheme('light', false), 'light')
  assert.equal(resolveAppearanceTheme('system', true), 'light')
  assert.equal(resolveAppearanceTheme('system', false), 'dark')
})

test('browser chrome colors follow the resolved application theme', () => {
  assert.equal(themeColorFor('dark'), '#111216')
  assert.equal(themeColorFor('light'), '#f4f5f7')
})
