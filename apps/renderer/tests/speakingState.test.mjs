import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createSpeakingStateStore,
  resolveSpeakingState,
} from '../src/features/calls/speakingState.ts'

test('speaking thresholds use hysteresis to avoid rapid boundary flapping', () => {
  assert.equal(resolveSpeakingState(false, 0.18), false)
  assert.equal(resolveSpeakingState(false, 0.19), true)
  assert.equal(resolveSpeakingState(true, 0.11), true)
  assert.equal(resolveSpeakingState(true, 0.1), false)
})

test('speaking updates notify only subscribers for the affected participant', () => {
  const store = createSpeakingStateStore()
  let firstUpdates = 0
  let secondUpdates = 0
  const unsubscribeFirst = store.subscribe('first', () => {
    firstUpdates += 1
  })
  store.subscribe('second', () => {
    secondUpdates += 1
  })

  store.set('first', true)
  store.set('first', true)
  assert.equal(store.getSnapshot('first'), true)
  assert.equal(firstUpdates, 1)
  assert.equal(secondUpdates, 0)

  store.clear()
  assert.equal(store.getSnapshot('first'), false)
  assert.equal(firstUpdates, 2)
  assert.equal(secondUpdates, 0)

  unsubscribeFirst()
  store.set('first', true)
  assert.equal(firstUpdates, 2)
})
