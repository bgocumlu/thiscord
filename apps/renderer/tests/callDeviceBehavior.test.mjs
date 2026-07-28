import assert from 'node:assert/strict'
import test from 'node:test'

import { callDeviceId } from '../src/features/calls/api.ts'
import { setAudioOutputDevice } from '../src/features/calls/speakerOutput.ts'

function storage() {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  }
}

test('call presence identity is stable per tab and distinct across tabs', () => {
  const original = globalThis.sessionStorage
  try {
    globalThis.sessionStorage = storage()
    const first = callDeviceId()
    assert.equal(callDeviceId(), first)

    globalThis.sessionStorage = storage()
    const second = callDeviceId()
    assert.notEqual(second, first)
  } finally {
    globalThis.sessionStorage = original
  }
})

test('speaker output explicitly resets to the system default sink', async () => {
  const selected = []
  assert.equal(await setAudioOutputDevice({
    setSinkId: async (deviceId) => selected.push(deviceId),
  }, 'speaker-one'), true)
  assert.equal(await setAudioOutputDevice({
    setSinkId: async (deviceId) => selected.push(deviceId),
  }, ''), true)
  assert.deepEqual(selected, ['speaker-one', ''])
})
