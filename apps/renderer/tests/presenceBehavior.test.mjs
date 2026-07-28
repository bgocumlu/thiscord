import assert from 'node:assert/strict'
import test from 'node:test'

import { transientTimings } from '@thiscord/shared'
import { preferredPresence } from '../src/features/members/usePresenceLifecycle.ts'
import { createCoalescedReporter } from '../src/lib/coalescedReporter.ts'

test('automatic idle uses real inactivity and an active call keeps presence online', () => {
  const now = 1_000_000
  const inactiveAt = now - transientTimings.presenceIdleMs
  assert.equal(preferredPresence('online', false, inactiveAt, now), 'idle')
  assert.equal(preferredPresence('online', true, inactiveAt, now), 'online')
  assert.equal(preferredPresence('dnd', false, now, now), 'dnd')
  assert.equal(preferredPresence('offline', true, now, now), 'offline')
})

test('coalesced reporters retain only the latest queued heartbeat', async () => {
  const events = []
  let release
  const reporter = createCoalescedReporter(assert.fail)
  reporter.submit(async () => {
    events.push('first:start')
    await new Promise((resolve) => {
      release = resolve
    })
    events.push('first:end')
  })
  reporter.submit(async () => {
    events.push('stale')
  })
  reporter.submit(async () => {
    events.push('latest')
  })
  release()
  await reporter.idle()
  assert.deepEqual(events, ['first:start', 'first:end', 'latest'])
})
