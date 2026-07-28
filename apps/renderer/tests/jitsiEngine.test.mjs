import assert from 'node:assert/strict'
import test from 'node:test'

import {
  clearResumeCallTarget,
  readResumeCallTarget,
  resolveJitsiApi,
} from '../src/features/calls/jitsiEngine.ts'

const api = { init() {} }
const sessionValues = new Map()
Object.defineProperty(globalThis, 'sessionStorage', {
  configurable: true,
  value: {
    getItem: (key) => sessionValues.get(key) ?? null,
    setItem: (key, value) => sessionValues.set(key, String(value)),
    removeItem: (key) => sessionValues.delete(key),
    clear: () => sessionValues.clear(),
    key: (index) => [...sessionValues.keys()][index] ?? null,
    get length() {
      return sessionValues.size
    },
  },
})

test('Jitsi loader accepts production and development module wrappers', () => {
  assert.equal(resolveJitsiApi({ default: api }), api)
  assert.equal(resolveJitsiApi({ default: { default: api } }), api)
  assert.equal(resolveJitsiApi({}, api), api)
})

test('Jitsi loader reports an invalid module shape clearly', () => {
  assert.throws(() => resolveJitsiApi({}), /did not expose its API/i)
})

test('call resume targets survive descriptor loading and clear only after joining', () => {
  sessionStorage.clear()
  sessionStorage.setItem(
    'thiscord_call_resume_target',
    JSON.stringify({ kind: 'conversation', id: 'conversation-one' }),
  )

  assert.deepEqual(readResumeCallTarget(), {
    kind: 'conversation',
    id: 'conversation-one',
  })
  assert.deepEqual(readResumeCallTarget(), {
    kind: 'conversation',
    id: 'conversation-one',
  })

  clearResumeCallTarget()
  assert.equal(readResumeCallTarget(), null)
})

test('invalid call resume targets are discarded', () => {
  sessionStorage.clear()
  sessionStorage.setItem('thiscord_call_resume_target', '{"kind":"unknown"}')
  assert.equal(readResumeCallTarget(), null)
  assert.equal(sessionStorage.getItem('thiscord_call_resume_target'), null)
})
