import assert from 'node:assert/strict'
import test from 'node:test'

import { createChannelMessageAdapter } from '../src/features/messaging/channelMessageAdapter.ts'
import { createConversationMessageAdapter } from '../src/features/conversations/conversationMessageAdapter.ts'
import {
  mergeFocusedMessage,
  shouldShowEmptyMessageState,
} from '../src/features/messaging/messagePresentation.ts'
import { fetchReactionBatches } from '../src/features/messaging/reactionBatches.ts'
import {
  createReadReceiptCoordinator,
  needsReadReceipt,
} from '../src/features/messaging/readState.ts'

test('read receipts are emitted once per latest message instead of once per render', () => {
  assert.equal(needsReadReceipt('message-one', '', ''), true)
  assert.equal(needsReadReceipt('message-one', '', 'message-one'), false)
  assert.equal(needsReadReceipt('message-one', 'message-one', ''), false)
  assert.equal(needsReadReceipt('message-two', 'message-one', 'message-one'), true)
  assert.equal(needsReadReceipt('', '', ''), false)
})

test('the shared read coordinator deduplicates pending receipts and permits retry after failure', () => {
  const coordinator = createReadReceiptCoordinator()
  assert.equal(coordinator.begin('message-one', ''), true)
  assert.equal(coordinator.pending(), 'message-one')
  assert.equal(coordinator.begin('message-one', ''), false)
  coordinator.failed('another-message')
  assert.equal(coordinator.begin('message-one', ''), false)
  coordinator.failed('message-one')
  assert.equal(coordinator.begin('message-one', ''), true)
  assert.equal(coordinator.begin('message-one', 'message-one'), false)
})

test('reaction requests stay within the backend limit and combine every batch', async () => {
  const messageIds = Array.from({ length: 205 }, (_, index) => `message-${index}`)
  const requestedBatches = []
  const reactions = await fetchReactionBatches(messageIds, async (batch) => {
    requestedBatches.push([...batch])
    return batch.map((message) => ({ message }))
  })

  assert.deepEqual(requestedBatches.map((batch) => batch.length), [100, 100, 5])
  assert.deepEqual(reactions.map((reaction) => reaction.message), messageIds)
})

test('a linked message outside the loaded page is inserted chronologically without duplication', () => {
  const newer = { id: 'newer', created: '2026-07-27T12:00:00.000Z' }
  const older = { id: 'older', created: '2026-07-27T10:00:00.000Z' }
  const focused = { id: 'focused', created: '2026-07-27T11:00:00.000Z' }

  assert.deepEqual(
    mergeFocusedMessage([older, newer], focused).map((message) => message.id),
    ['older', 'focused', 'newer'],
  )
  assert.equal(mergeFocusedMessage([older, focused, newer], focused).length, 3)
})

test('message empty state stays hidden while any request is pending or failed', () => {
  assert.equal(shouldShowEmptyMessageState(0, [false, false]), true)
  assert.equal(shouldShowEmptyMessageState(0, [false, true]), false)
  assert.equal(shouldShowEmptyMessageState(1, [false, false]), false)
})

function adapterFixture() {
  const requests = []
  const invalidations = []
  const client = {
    send(path, options = {}) {
      requests.push({ path, options })
      if (path.includes('/search?')) return Promise.resolve({ page: 1, hasMore: false, items: [] })
      if (path.endsWith('/reactions/query')) {
        return Promise.resolve({
          reactions: options.body.messageIds.map((message) => ({ message })),
        })
      }
      if (path === '/api/thiscord/messages/linked-channel-message') {
        return Promise.resolve({
          id: 'linked-channel-message',
          channel: 'channel-one',
        })
      }
      return Promise.resolve({})
    },
    filter() {
      return ''
    },
    collection() {
      return {
        getList() {
          return Promise.resolve({ items: [], page: 1, totalPages: 1 })
        },
        getOne(id) {
          return Promise.resolve({ id, conversation: 'conversation-one' })
        },
      }
    },
  }
  const queryClient = {
    invalidateQueries({ queryKey }) {
      invalidations.push(queryKey)
      return Promise.resolve()
    },
  }
  return { client, queryClient, requests, invalidations }
}

test('the channel adapter keeps channel permissions, routes, and invalidations explicit', async () => {
  const fixture = adapterFixture()
  const channel = {
    id: 'channel-one',
    community: 'community-one',
    kind: 'announcement',
  }
  const adapter = createChannelMessageAdapter({
    client: fixture.client,
    queryClient: fixture.queryClient,
    channel,
    permissions: new Set(['send_messages', 'manage_messages']),
  })
  const author = { id: 'author' }
  const message = { id: 'message-one', author: 'author', pinned: false }

  assert.equal(adapter.kind, 'channel')
  assert.equal(adapter.reverseSearchResults, false)
  assert.equal(adapter.policy.disabledReason, undefined)
  assert.equal(adapter.policy.canEdit(message, author), true)
  assert.equal(adapter.policy.canEdit(message, { id: 'moderator' }), true)
  assert.equal(adapter.policy.canDelete(message, { id: 'moderator' }), true)
  assert.equal(adapter.policy.canPin(message, author), true)
  await adapter.save({ content: 'hello', files: [], reply: null, editing: null })
  await adapter.markRead(message.id)
  await adapter.load('linked-channel-message')
  assert.deepEqual(await adapter.loadReactions(['search-result']), [{ message: 'search-result' }])

  assert.equal(fixture.requests[0].path, '/api/thiscord/messages')
  assert.equal(fixture.requests[1].path, '/api/thiscord/channels/channel-one/read')
  assert.equal(fixture.requests[2].path, '/api/thiscord/messages/linked-channel-message')
  assert.equal(fixture.requests[3].path, '/api/thiscord/channels/channel-one/reactions/query')
  assert.deepEqual(fixture.invalidations, [
    ['messages', 'channel-one'],
    ['message_search', 'community-one', 'channel-one'],
    ['unread_summary', 'community-one'],
  ])

  const ordinaryAdapter = createChannelMessageAdapter({
    client: fixture.client,
    queryClient: fixture.queryClient,
    channel: { ...channel, kind: 'text' },
    permissions: new Set(['send_messages']),
  })
  assert.equal(ordinaryAdapter.policy.canEdit(message, { id: 'other' }), false)
  assert.equal(ordinaryAdapter.policy.canDelete(message, { id: 'other' }), false)
})

test('the conversation adapter keeps membership read state and conversation ownership rules explicit', async () => {
  const fixture = adapterFixture()
  const conversation = { id: 'conversation-one', kind: 'group', owner: 'owner' }
  const membership = {
    id: 'membership-one',
    conversation: conversation.id,
    user: 'author',
    lastMessage: 'persisted-message',
  }
  const adapter = createConversationMessageAdapter({
    client: fixture.client,
    queryClient: fixture.queryClient,
    conversation,
    membership,
  })
  const author = { id: 'author' }
  const message = { id: 'message-one', author: 'author', pinned: false }

  assert.equal(adapter.kind, 'conversation')
  assert.equal(adapter.reverseSearchResults, true)
  assert.equal(adapter.persistedReadMessage, 'persisted-message')
  assert.equal(adapter.policy.canDelete(message, author), true)
  assert.equal(adapter.policy.canDelete(message, { id: 'other' }), false)
  assert.equal(adapter.policy.canPin(message, { id: 'other' }), true)
  await adapter.save({ content: 'hello', files: [], reply: null, editing: null })
  await adapter.markRead(message.id)
  assert.deepEqual(await adapter.load('linked-direct-message'), {
    id: 'linked-direct-message',
    conversation: 'conversation-one',
  })
  assert.deepEqual(await adapter.loadReactions(['search-result']), [{ message: 'search-result' }])
  assert.equal(
    fixture.requests.at(-1).path,
    '/api/thiscord/conversations/conversation-one/reactions/query',
  )

  assert.equal(fixture.requests[0].path, '/api/thiscord/direct-messages')
  assert.equal(fixture.requests[1].path, '/api/thiscord/conversations/conversation-one/read')
  assert.deepEqual(fixture.invalidations, [
    ['direct_messages', 'conversation-one'],
    ['direct_message_search', 'conversation-one'],
    ['conversations'],
    ['conversation_members'],
    ['conversation_members'],
  ])
})
