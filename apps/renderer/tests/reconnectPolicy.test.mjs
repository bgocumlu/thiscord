import assert from 'node:assert/strict'
import test from 'node:test'

import {
  automaticReconnectAfter,
  MAX_AUTOMATIC_RECONNECTS,
} from '../src/features/calls/reconnectPolicy.ts'

test('media reconnect uses three bounded exponential retries', () => {
  assert.equal(MAX_AUTOMATIC_RECONNECTS, 3)
  assert.deepEqual(automaticReconnectAfter(0), { attempt: 1, delayMs: 750 })
  assert.deepEqual(automaticReconnectAfter(1), { attempt: 2, delayMs: 1_500 })
  assert.deepEqual(automaticReconnectAfter(2), { attempt: 3, delayMs: 3_000 })
  assert.equal(automaticReconnectAfter(3), null)
})
