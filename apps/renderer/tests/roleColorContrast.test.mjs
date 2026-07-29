import assert from 'node:assert/strict'
import test from 'node:test'
import {
  contrastRatio,
  roleTextColors,
} from '../src/features/roles/colorContrast.ts'

test('role text colors meet AA contrast in both themes', () => {
  for (const requested of ['#ffffff', '#000000', '#6957e8', '#55c790', '#d6a64a']) {
    const colors = roleTextColors(requested)
    assert.ok(contrastRatio(colors.dark, '#14171d') >= 4.5)
    assert.ok(contrastRatio(colors.light, '#ffffff') >= 4.5)
  }
})

test('invalid role colors fall back to the theme copy colors', () => {
  assert.deepEqual(roleTextColors('not-a-color'), {
    dark: '#f3f4f8',
    light: '#20232a',
  })
})
