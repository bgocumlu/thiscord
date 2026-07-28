import assert from 'node:assert/strict'
import test from 'node:test'
import { displayMediaStreams } from '../src/displayMedia.ts'

const source = { id: 'screen:1:0', name: 'Screen 1' }

test('Windows display capture supplies loopback audio only when requested', () => {
  assert.deepEqual(
    displayMediaStreams(source, true, true, 'win32'),
    { video: source, audio: 'loopback' },
  )
  assert.deepEqual(displayMediaStreams(source, true, false, 'win32'), { video: source })
  assert.deepEqual(displayMediaStreams(source, false, true, 'win32'), { video: source })
  assert.deepEqual(displayMediaStreams(source, true, true, 'darwin'), { video: source })
  assert.deepEqual(displayMediaStreams(undefined, true, true, 'win32'), {})
})
