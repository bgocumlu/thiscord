import assert from 'node:assert/strict'
import test from 'node:test'
import { runtimeAccentTokens } from '../src/lib/brandAccent.ts'
import { contrastRatio } from '../src/lib/colorContrast.ts'

test('runtime accent emphasis remains AA-safe in both themes', () => {
  for (const accent of ['#ffffff', '#ffff00', '#000000', '#6957e8', '#55c790', '#e36570']) {
    const tokens = runtimeAccentTokens(accent)
    assert.ok(contrastRatio(tokens.darkEmphasis, '#0d0f13') >= 4.5)
    assert.ok(contrastRatio(tokens.lightEmphasis, '#f4f5f7') >= 4.5)
    assert.ok(contrastRatio(tokens.contrast, accent) >= 4.5)
  }
})

test('contrast checks accept browser-computed RGB colors', () => {
  assert.ok(contrastRatio('rgb(86, 94, 106)', 'rgb(220, 224, 230)') >= 4.5)
})
