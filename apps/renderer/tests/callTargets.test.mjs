import assert from 'node:assert/strict'
import test from 'node:test'

import { callAccessWasRevoked } from '../src/features/calls/api.ts'
import { channelSelectionClosesNavigation } from '../src/features/calls/callNavigationBehavior.ts'
import { recoverJoinFailure } from '../src/features/calls/joinFailure.ts'
import {
  conversationCallTarget,
  participantBelongsToTarget,
} from '../src/features/calls/targets.ts'

test('conversation call descriptors use conversation navigation and direct-recipient names', () => {
  const conversation = {
    id: 'conversation/one',
    kind: 'direct',
    name: '',
    owner: 'current',
    created: '',
    updated: '',
  }
  const target = conversationCallTarget(conversation, [
    { id: 'one', conversation: conversation.id, user: 'current' },
    {
      id: 'two',
      conversation: conversation.id,
      user: 'other',
      expand: { user: { displayName: 'Other person' } },
    },
  ], 'current')

  assert.deepEqual(target, {
    target: { kind: 'conversation', id: conversation.id },
    name: 'Other person',
    href: '/channels/@me/conversation%2Fone',
  })
})

test('conversation occupancy remains isolated from channel occupancy', () => {
  const participant = {
    expand: {
      call: {
        expand: {
          room: { channel: '', conversation: 'conversation' },
        },
      },
    },
  }
  assert.equal(participantBelongsToTarget(participant, { kind: 'conversation', id: 'conversation' }), true)
  assert.equal(participantBelongsToTarget(participant, { kind: 'conversation', id: 'other' }), false)
  assert.equal(participantBelongsToTarget(participant, { kind: 'channel', id: 'conversation' }), false)
})

test('authorization failures are distinguished from transient presence failures', () => {
  assert.equal(callAccessWasRevoked({ status: 403 }), true)
  assert.equal(callAccessWasRevoked({ status: 404 }), true)
  assert.equal(callAccessWasRevoked({ status: 500 }), false)
  assert.equal(callAccessWasRevoked(new Error('offline')), false)
})

test('text selection dismisses mobile navigation while voice selection preserves it', () => {
  assert.equal(channelSelectionClosesNavigation('text'), true)
  assert.equal(channelSelectionClosesNavigation('announcement'), true)
  assert.equal(channelSelectionClosesNavigation('voice'), false)
})

test('a revoked reconnect leaves the call and releases retained media resources', async () => {
  let left = false
  const recovered = await recoverJoinFailure(
    { status: 403 },
    { kind: 'conversation', id: 'revoked-conversation' },
    async () => {
      left = true
    },
  )
  assert.equal(recovered, true)
  assert.equal(left, true)
})
