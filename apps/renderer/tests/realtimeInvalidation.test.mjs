import assert from 'node:assert/strict'
import test from 'node:test'

import {
  callOccupancyQueryMatches,
  callTargetForRealtimeEvent,
  queryKeysForRealtimeEvent,
  updateCallOccupancyCache,
  updateMessageHistoryCache,
  updatePresenceDirectoryCache,
} from '../src/features/realtime/invalidation.ts'
import {
  realtimeExpandFor,
  realtimeFilterFor,
  settleRealtimeSubscriptions,
} from '../src/hooks/useRealtimeInvalidation.ts'

test('realtime collection events map to explicit feature query contracts', () => {
  assert.deepEqual(queryKeysForRealtimeEvent('call_participants'), [['call_occupancy']])
  assert.deepEqual(queryKeysForRealtimeEvent('call_rooms'), [['call_occupancy']])
  assert.deepEqual(queryKeysForRealtimeEvent('community_presence'), [['community_members']])
  assert.deepEqual(queryKeysForRealtimeEvent('channel_permissions', { channel: 'channel-one' }), [
    ['channel_permissions', 'channel-one'],
    ['effective_permissions'],
    ['channels'],
    ['unread_summary'],
    ['global_search'],
  ])
  assert.deepEqual(queryKeysForRealtimeEvent('roles', { community: 'community-one' }), [
    ['roles', 'community-one'],
    ['community_members', 'community-one'],
    ['effective_permissions', 'community-one', ''],
    ['channels', 'community-one'],
    ['unread_summary', 'community-one'],
    ['global_search'],
  ])
  assert.deepEqual(queryKeysForRealtimeEvent('communities', { id: 'community-one' }), [
    ['memberships'],
    ['channels', 'community-one'],
    ['unread_summary', 'community-one'],
    ['effective_permissions', 'community-one', ''],
    ['global_search'],
  ])
  assert.deepEqual(queryKeysForRealtimeEvent('conversation_members', { user: 'member-one' }), [
    ['conversation_members', 'member-one'],
    ['conversations'],
    ['global_search'],
  ])
  assert.deepEqual(queryKeysForRealtimeEvent('messages', { channel: 'channel-one' }), [
    ['messages', 'channel-one'],
    ['message_search'],
    ['unread_summary'],
    ['global_search'],
  ])
  assert.deepEqual(queryKeysForRealtimeEvent('direct_messages', { conversation: 'conversation-one' }), [
    ['direct_messages', 'conversation-one'],
    ['direct_message_search'],
    ['conversations'],
    ['global_search'],
  ])
  assert.deepEqual(queryKeysForRealtimeEvent('notifications', { user: 'member-one' }), [
    ['notifications', 'member-one'],
  ])
})

test('call realtime events only invalidate occupancy queries containing their target', () => {
  const record = {
    call: 'call-one',
    expand: {
      call: {
        expand: {
          room: { channel: 'voice-one' },
        },
      },
    },
  }
  const target = callTargetForRealtimeEvent('call_participants', record)
  assert.equal(target, 'channel:voice-one')
  assert.equal(callOccupancyQueryMatches(['call_occupancy', 'channel:voice-one,channel:voice-two'], target), true)
  assert.equal(callOccupancyQueryMatches(['call_occupancy', 'conversation:direct-one'], target), false)
})

test('presence and call realtime events patch cached rows without directory refetches', () => {
  const directory = {
    pageParams: [1],
    pages: [{
      page: 1,
      perPage: 50,
      hasMore: false,
      items: [{ id: 'membership', user: 'member' }],
      memberRoles: [],
      presence: [],
    }],
  }
  const online = { id: 'presence', user: 'member', status: 'online' }
  const patched = updatePresenceDirectoryCache(directory, 'create', online)
  assert.deepEqual(patched.pages[0].presence, [online])
  assert.deepEqual(
    updatePresenceDirectoryCache(patched, 'delete', online).pages[0].presence,
    [],
  )

  const participant = { id: 'participant', leftAt: '', user: 'member' }
  assert.deepEqual(updateCallOccupancyCache([], 'create', participant), [participant])
  const expandedParticipant = {
    ...participant,
    expand: {
      user: { id: 'member', displayName: 'Correct name' },
      call: { id: 'call', expand: { room: { channel: 'voice-one' } } },
    },
  }
  const patchedParticipant = updateCallOccupancyCache(
    [expandedParticipant],
    'update',
    { ...participant, muted: true },
  )
  assert.equal(patchedParticipant[0].expand.user.displayName, 'Correct name')
  assert.equal(patchedParticipant[0].expand.call.expand.room.channel, 'voice-one')
  assert.deepEqual(
    updateCallOccupancyCache([participant], 'update', { ...participant, leftAt: 'now' }),
    [],
  )
})

test('message realtime events merge into paginated history without duplicates', () => {
  const older = { id: 'older', content: 'old' }
  const duplicate = { id: 'message', content: 'stale' }
  const history = {
    pageParams: [null, { id: 'cursor' }],
    pages: [
      { items: [duplicate], hasMore: true, nextCursor: { id: 'cursor' }, perPage: 50 },
      { items: [older, duplicate], hasMore: false, nextCursor: null, perPage: 50 },
    ],
  }
  const fresh = { id: 'fresh', content: 'new' }
  const created = updateMessageHistoryCache(history, 'create', fresh)
  assert.deepEqual(created.pages[0].items, [fresh, duplicate])

  const updatedRecord = { id: 'message', content: 'updated' }
  const updated = updateMessageHistoryCache(created, 'update', updatedRecord)
  assert.deepEqual(updated.pages[0].items, [fresh, updatedRecord])
  assert.deepEqual(updated.pages[1].items, [older])

  const removed = updateMessageHistoryCache(updated, 'delete', fresh)
  assert.deepEqual(removed.pages[0].items, [updatedRecord])
  assert.equal(updateMessageHistoryCache(undefined, 'create', fresh), undefined)
})

test('message realtime subscriptions request the expansions required to render rows', () => {
  assert.equal(realtimeExpandFor('messages'), 'author,replyTo,replyTo.author')
  assert.equal(realtimeExpandFor('direct_messages'), 'author,replyTo,replyTo.author')
  assert.equal(realtimeExpandFor('call_participants'), 'user,call.room')
  assert.equal(realtimeExpandFor('community_presence'), '')
})

test('private realtime collections always receive user or community filters', () => {
  const client = {
    filter(template, values) {
      return `${template} ${JSON.stringify(values)}`
    },
  }
  const communityScope = { enabled: true, userId: 'user-one', communityId: 'community-one' }
  const directScope = { enabled: true, userId: 'user-one', communityId: '' }

  for (const collection of [
    'communities',
    'conversations',
    'conversation_members',
    'direct_messages',
    'call_rooms',
    'call_sessions',
    'call_participants',
    'notifications',
  ]) {
    assert.match(realtimeFilterFor(client, communityScope, collection), /user-one|community-one/)
    assert.match(realtimeFilterFor(client, directScope, collection), /user-one/)
  }
  assert.match(
    realtimeFilterFor(client, directScope, 'conversation_members'),
    /user = \{:user\}/,
  )
  assert.match(
    realtimeFilterFor(client, communityScope, 'community_presence'),
    /community-one/,
  )
})

test('a failed realtime attempt waits for and closes every late subscription', async () => {
  const closed = []
  let resolveLate
  const late = new Promise((resolve) => {
    resolveLate = resolve
  })
  const attempt = settleRealtimeSubscriptions([
    Promise.resolve(() => closed.push('early')),
    Promise.reject(new Error('subscription failed')),
    late,
  ], () => false)

  await assert.rejects(attempt, /subscription failed/)
  resolveLate(() => closed.push('late'))
  await new Promise((resolve) => setImmediate(resolve))
  assert.deepEqual(closed.sort(), ['early', 'late'])
})
