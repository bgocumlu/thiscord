import assert from 'node:assert/strict'
import test from 'node:test'
import {
  avatarColor,
  avatarContrast,
  avatarPaletteColors,
} from '../src/features/members/avatarColor.ts'
import { contrastRatio } from '../src/lib/colorContrast.ts'

test('generated avatar colors remain deterministic and AA-safe', () => {
  assert.equal(avatarColor('same-user'), avatarColor('same-user'))
  for (const color of avatarPaletteColors()) {
    assert.ok(contrastRatio(avatarContrast, color) >= 4.5)
  }
})
