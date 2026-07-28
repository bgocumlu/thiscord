import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeAuthIdentity } from '../src/auth/identity.ts'

test('login identity tolerates mobile autocapitalization and surrounding whitespace', () => {
  assert.equal(normalizeAuthIdentity('  Berkay.Dev  '), 'berkay.dev')
  assert.equal(normalizeAuthIdentity('  USER@EXAMPLE.COM  '), 'user@example.com')
})
