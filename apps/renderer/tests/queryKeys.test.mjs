import assert from 'node:assert/strict'
import test from 'node:test'

import { callKeys } from '../src/features/calls/queryKeys.ts'
import { channelKeys } from '../src/features/channels/queryKeys.ts'
import { communityKeys } from '../src/features/communities/queryKeys.ts'
import { conversationKeys } from '../src/features/conversations/queryKeys.ts'
import { memberKeys } from '../src/features/members/queryKeys.ts'
import { messageKeys } from '../src/features/messaging/queryKeys.ts'
import { notificationKeys } from '../src/features/notifications/queryKeys.ts'
import { roleKeys } from '../src/features/roles/queryKeys.ts'
import { searchKeys } from '../src/features/search/queryKeys.ts'
import { globalSearchRefreshMs } from '../src/features/search/queries.ts'

test('feature query-key roots do not collide', () => {
  const roots = [
    callKeys.all,
    channelKeys.all,
    channelKeys.effectivePermissionsAll,
    channelKeys.permissionsAll,
    communityKeys.memberships,
    conversationKeys.all,
    conversationKeys.members,
    conversationKeys.messagesAll,
    conversationKeys.reactionsAll,
    conversationKeys.typingAll,
    memberKeys.directories,
    memberKeys.presenceAll,
    messageKeys.all,
    messageKeys.unreadSummaries,
    messageKeys.reactionsAll,
    messageKeys.typingAll,
    notificationKeys.all,
    roleKeys.all,
    roleKeys.assignments,
    searchKeys.all,
  ].map((key) => JSON.stringify(key))

  assert.equal(new Set(roots).size, roots.length)
})

test('active global search reauthorizes across non-focused communities promptly', () => {
  assert.equal(globalSearchRefreshMs, 5_000)
})

test('target lookups cannot collide with feature list queries for equal record ids', () => {
  assert.notDeepEqual(
    channelKeys.list('same-id'),
    channelKeys.target('same-id'),
  )
})
