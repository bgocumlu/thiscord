import assert from 'node:assert/strict'
import test from 'node:test'

import { callApi } from '../src/features/calls/api.ts'
import { setAudioOutputDevice } from '../src/features/calls/speakerOutput.ts'

test('call presence sends an explicit in-memory lease and sequence', async () => {
  const requests = []
  const client = {
    send(path, options) {
      requests.push({ path, options })
      return Promise.resolve({ active: true, accepted: true, sequence: 7 })
    },
  }
  await callApi.reportPresence(client, { kind: 'channel', id: 'voice' }, {
    state: 'update',
    leaseId: 'page-call-lease',
    sequence: 7,
    muted: false,
  })
  assert.equal(requests[0].path, '/api/thiscord/calls/channel/voice/presence')
  assert.deepEqual(requests[0].options.body, {
    state: 'update',
    leaseId: 'page-call-lease',
    sequence: 7,
    muted: false,
  })
  assert.equal(requests[0].options.requestKey, null)
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
