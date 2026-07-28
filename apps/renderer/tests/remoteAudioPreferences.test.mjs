import assert from 'node:assert/strict'
import test from 'node:test'

import {
  readRemoteAudioPreferences,
  remoteAudioPreference,
  updateRemoteAudioPreference,
  writeRemoteAudioPreferences,
} from '../src/features/calls/remoteAudioPreferences.ts'

function memoryStorage(initial = null) {
  let value = initial
  return {
    getItem: () => value,
    setItem: (_key, next) => {
      value = next
    },
    value: () => value,
  }
}

test('remote audio preferences are versioned, normalized, and omit defaults', () => {
  const storage = memoryStorage(JSON.stringify({
    userA: { muted: true, volume: 125 },
    userB: { muted: false, volume: 80.4 },
    broken: { muted: 'yes', volume: 50 },
  }))
  const preferences = readRemoteAudioPreferences(storage)

  assert.deepEqual(preferences, {
    userA: { muted: true, volume: 100 },
    userB: { muted: false, volume: 80 },
  })
  assert.deepEqual(remoteAudioPreference(preferences, 'missing'), {
    muted: false,
    volume: 100,
  })

  const restoredDefault = updateRemoteAudioPreference(preferences, 'userB', { volume: 100 })
  assert.equal('userB' in restoredDefault, false)
})

test('remote audio preferences persist per user without changing saved volume on mute', () => {
  const storage = memoryStorage()
  let preferences = updateRemoteAudioPreference({}, 'member', { volume: 63 })
  preferences = updateRemoteAudioPreference(preferences, 'member', { muted: true })
  writeRemoteAudioPreferences(preferences, storage)

  assert.deepEqual(readRemoteAudioPreferences(storage), {
    member: { muted: true, volume: 63 },
  })
  assert.match(storage.value(), /"member"/)
})
