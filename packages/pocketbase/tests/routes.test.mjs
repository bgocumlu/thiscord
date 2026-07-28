import assert from 'node:assert/strict'
import test from 'node:test'

import {
  communityFixture,
  event,
  loadActionRoutes,
  loadLifecycleCron,
  loadLifecycleHandlers,
  MemoryApp,
  record,
} from './support/pocketbase-harness.mjs'

const routes = loadActionRoutes()

test('preference patches merge transactionally without erasing unrelated fields', () => {
  const auth = record('users', 'preferences-user', {
    preferences: {
      theme: 'dark',
      compactMode: false,
      reduceMotion: false,
      notificationSound: true,
      presenceStatus: 'online',
      mutedChannels: ['channel-a'],
      mutedConversations: ['conversation-a'],
    },
  })
  const app = new MemoryApp({ users: [auth] })

  const appearance = routes.get('PATCH /api/thiscord/account/preferences')(event({
    app,
    auth,
    body: {
      preferences: {
        theme: 'light',
        compactMode: true,
      },
    },
  }))
  assert.equal(appearance.value.preferences.theme, 'light')
  assert.equal(appearance.value.preferences.compactMode, true)
  assert.deepEqual(appearance.value.preferences.mutedChannels, ['channel-a'])
  assert.deepEqual(appearance.value.preferences.mutedConversations, ['conversation-a'])

  const mute = routes.get('PATCH /api/thiscord/account/preferences')(event({
    app,
    auth,
    body: { preferences: { mutedChannels: ['channel-a', 'channel-b', 'channel-b'] } },
  }))
  assert.deepEqual(mute.value.preferences.mutedChannels, ['channel-a', 'channel-b'])
  assert.equal(mute.value.preferences.theme, 'light')
  assert.equal(mute.value.preferences.notificationSound, true)
  const invisible = routes.get('PATCH /api/thiscord/account/preferences')(event({
    app,
    auth,
    body: { preferences: { presenceStatus: 'offline' } },
  }))
  assert.equal(invisible.value.preferences.presenceStatus, 'offline')
})

test('route-specific channel and conversation lookups authorize deep links independently of list pages', () => {
  const auth = record('users', 'member')
  const channelFixture = communityFixture({
    permissions: ['view_channels', 'read_history'],
  })
  const channelResponse = routes.get('GET /api/thiscord/channels/{id}')(event({
    app: channelFixture.app,
    auth,
    path: { id: channelFixture.channel.id },
  }))
  assert.equal(channelResponse.value.id, channelFixture.channel.id)
  const message = record('messages', 'message-75', {
    channel: channelFixture.channel.id,
    author: auth.id,
    content: 'Linked from a notification',
  })
  channelFixture.app.collection('messages').push(message)
  const messageResponse = routes.get('GET /api/thiscord/messages/{id}')(event({
    app: channelFixture.app,
    auth,
    path: { id: message.id },
  }))
  assert.equal(messageResponse.value.id, message.id)
  const hiddenHistoryFixture = communityFixture({
    permissions: ['view_channels'],
  })
  hiddenHistoryFixture.app.collection('messages').push(record('messages', 'hidden-message', {
    channel: hiddenHistoryFixture.channel.id,
    author: auth.id,
    content: 'Not visible without history access',
  }))
  assert.throws(
    () => routes.get('GET /api/thiscord/messages/{id}')(event({
      app: hiddenHistoryFixture.app,
      auth,
      path: { id: 'hidden-message' },
    })),
    /missing permission: read_history/i,
  )

  const conversation = record('conversations', 'conversation-75', {
    kind: 'direct',
    owner: auth.id,
  })
  const member = record('conversation_members', 'conversation-member', {
    conversation: conversation.id,
    user: auth.id,
  })
  const app = new MemoryApp({
    users: [auth],
    conversations: [conversation],
    conversation_members: [member],
  })
  const conversationResponse = routes.get('GET /api/thiscord/conversations/{id}')(event({
    app,
    auth,
    path: { id: conversation.id },
  }))
  assert.equal(conversationResponse.value.conversation.id, conversation.id)
  assert.deepEqual(conversationResponse.value.members, [member])
})

test('role permission edits preserve authorized callers and eject only after voice access is removed', () => {
  const fixture = communityFixture({
    permissions: ['view_channels'],
    channelKind: 'voice',
  })
  const ownerMembership = record('memberships', 'owner-membership', {
    community: fixture.community.id,
    user: fixture.community.getString('owner'),
    state: 'active',
  })
  fixture.app.collection('memberships').push(ownerMembership)
  const voiceRole = record('roles', 'voice-role', {
    community: fixture.community.id,
    name: 'Voice',
    managed: false,
    position: 1,
    permissions: ['connect_voice'],
  })
  fixture.app.collection('roles').push(voiceRole)
  fixture.app.collection('member_roles').push(record('member_roles', 'voice-assignment', {
    membership: fixture.membership.id,
    role: voiceRole.id,
  }))
  const call = record('call_sessions', 'active-call', {
    room: fixture.callRoom.id,
    endedAt: '',
  })
  const expiresAt = new Date(Date.now() + 60_000).toISOString()
  const participant = record('call_participants', 'active-participant', {
    call: call.id,
    user: fixture.membership.getString('user'),
    leftAt: '',
    expiresAt,
    devices: {
      laptop: {
        expiresAt,
        muted: false,
        deafened: false,
        camera: false,
        sharing: false,
      },
    },
  })
  fixture.app.collection('call_sessions').push(call)
  fixture.app.collection('call_participants').push(participant)
  fixture.app.collection('call_token_versions').push(record('call_token_versions', 'member-token', {
    room: fixture.callRoom.id,
    user: fixture.membership.getString('user'),
    version: 1,
    expiresAt: new Date(Date.now() + 300_000).toISOString(),
  }))
  const controlRequests = []
  globalThis.$os.getenv = (name) => ({
    JITSI_APP_SECRET: 'control-secret',
    JITSI_CONTROL_URL: 'http://prosody.test/thiscord-call-control',
  })[name] || ''
  globalThis.$http.send = (request) => {
    controlRequests.push(JSON.parse(request.body))
    return { statusCode: 200, raw: '{"kicked":1}' }
  }
  const patchRole = routes.get('PATCH /api/thiscord/roles/{id}')
  const auth = record('users', fixture.community.getString('owner'))

  patchRole(event({
    app: fixture.app,
    auth,
    body: { permissions: ['connect_voice', 'send_messages'] },
    path: { id: voiceRole.id },
  }))
  assert.equal(controlRequests.length, 2)
  assert.equal(controlRequests[0].action, 'revoke')
  assert.equal(controlRequests[0].tokenVersion, 1)
  assert.ok(controlRequests[0].expiresAt > Date.now())
  const policyRequest = controlRequests[1]
  assert.deepEqual(policyRequest, {
    roomName: 'opaque-room',
    userIds: ['member'],
    action: 'policy',
    canSpeak: false,
    canStreamVideo: false,
  })
  assert.equal(participant.getString('leftAt'), '')

  patchRole(event({
    app: fixture.app,
    auth,
    body: { permissions: ['send_messages'] },
    path: { id: voiceRole.id },
  }))
  assert.equal(controlRequests.length, 4)
  assert.equal(controlRequests[2].action, 'revoke')
  assert.equal(controlRequests[2].tokenVersion, 1)
  assert.equal(controlRequests[3].action, 'kick')
  assert.ok(participant.getString('leftAt'))
})

test('message policy rejects empty, unauthorized attachment, mention, and slowmode sends', () => {
  const fixture = communityFixture({
    permissions: ['view_channels', 'send_messages', 'read_history'],
  })
  const auth = record('users', 'member', { email: 'member@example.test' })
  const handler = routes.get('POST /api/thiscord/messages')

  assert.throws(
    () => handler(event({ app: fixture.app, auth, body: { channel: fixture.channel.id } })),
    /needs text or an attachment/i,
  )
  assert.throws(
    () => handler(event({
      app: fixture.app,
      auth,
      body: { channel: fixture.channel.id, content: 'file' },
      files: ['attachment.txt'],
    })),
    /cannot attach files/i,
  )
  assert.throws(
    () => handler(event({
      app: fixture.app,
      auth,
      body: { channel: fixture.channel.id, content: 'hello @everyone' },
    })),
    /cannot mention everyone/i,
  )

  fixture.channel.set('slowmodeSeconds', 30)
  fixture.app.collection('messages').push(record('messages', 'previous', {
    channel: fixture.channel.id,
    author: auth.id,
    content: 'previous',
    deletedAt: '',
    created: new Date().toISOString(),
  }))
  assert.throws(
    () => handler(event({
      app: fixture.app,
      auth,
      body: { channel: fixture.channel.id, content: 'too soon' },
    })),
    /slow mode/i,
  )
})

test('message ordering is deterministic and reaction toggles remain serialized', () => {
  const auth = record('users', 'message-member')
  const fixture = communityFixture({
    userId: auth.id,
    permissions: ['view_channels', 'read_history', 'add_reactions'],
  })
  const created = '2026-07-27 10:00:00.000Z'
  const first = record('messages', 'message-a', {
    channel: fixture.channel.id,
    created,
  })
  const second = record('messages', 'message-b', {
    channel: fixture.channel.id,
    created,
  })
  fixture.app.collection('messages').push(first, second)

  const list = routes.get('GET /api/thiscord/channels/{id}/messages')
  const page = list(event({
    app: fixture.app,
    auth,
    path: { id: fixture.channel.id },
  }))
  assert.deepEqual(page.value.items.map((item) => item.id), [second.id, first.id])

  const toggleChannel = routes.get('POST /api/thiscord/messages/{id}/reactions')
  assert.equal(toggleChannel(event({
    app: fixture.app,
    auth,
    body: { emoji: '👍' },
    path: { id: second.id },
  })).value.active, true)
  assert.equal(toggleChannel(event({
    app: fixture.app,
    auth,
    body: { emoji: '👍' },
    path: { id: second.id },
  })).value.active, false)
  assert.equal(fixture.app.collection('reactions').length, 0)

  const conversation = record('conversations', 'reaction-conversation', {
    kind: 'direct',
    owner: auth.id,
  })
  const membership = record('conversation_members', 'reaction-membership', {
    conversation: conversation.id,
    user: auth.id,
  })
  const direct = record('direct_messages', 'reaction-direct', {
    conversation: conversation.id,
  })
  fixture.app.collection('conversations').push(conversation)
  fixture.app.collection('conversation_members').push(membership)
  fixture.app.collection('direct_messages').push(direct)
  const toggleDirect = routes.get('POST /api/thiscord/direct-messages/{id}/reactions')
  assert.equal(toggleDirect(event({
    app: fixture.app,
    auth,
    body: { emoji: '👍' },
    path: { id: direct.id },
  })).value.active, true)
  assert.equal(toggleDirect(event({
    app: fixture.app,
    auth,
    body: { emoji: '👍' },
    path: { id: direct.id },
  })).value.active, false)
  assert.equal(fixture.app.collection('direct_reactions').length, 0)
})

test('read receipts only advance when cross-device requests finish out of order', () => {
  const auth = record('users', 'reader')
  const fixture = communityFixture({
    userId: auth.id,
    permissions: ['view_channels', 'read_history'],
  })
  const older = record('messages', 'older-message', {
    channel: fixture.channel.id,
    created: '2026-07-27 10:00:00.000Z',
  })
  const newer = record('messages', 'newer-message', {
    channel: fixture.channel.id,
    created: '2026-07-27 11:00:00.000Z',
  })
  fixture.app.collection('messages').push(older, newer)
  const markChannelRead = routes.get('POST /api/thiscord/channels/{id}/read')
  assert.throws(
    () => markChannelRead(event({
      app: fixture.app,
      auth,
      body: { lastMessage: '' },
      path: { id: fixture.channel.id },
    })),
    /invalid lastMessage/i,
  )
  markChannelRead(event({
    app: fixture.app,
    auth,
    body: { lastMessage: newer.id },
    path: { id: fixture.channel.id },
  }))
  markChannelRead(event({
    app: fixture.app,
    auth,
    body: { lastMessage: older.id },
    path: { id: fixture.channel.id },
  }))
  assert.equal(fixture.app.collection('read_states')[0].getString('lastMessage'), newer.id)

  const conversation = record('conversations', 'read-conversation', {
    kind: 'direct',
    owner: auth.id,
  })
  const membership = record('conversation_members', 'read-membership', {
    conversation: conversation.id,
    user: auth.id,
  })
  const olderDirect = record('direct_messages', 'older-direct', {
    conversation: conversation.id,
    created: '2026-07-27 10:00:00.000Z',
  })
  const newerDirect = record('direct_messages', 'newer-direct', {
    conversation: conversation.id,
    created: '2026-07-27 11:00:00.000Z',
  })
  fixture.app.collection('conversations').push(conversation)
  fixture.app.collection('conversation_members').push(membership)
  fixture.app.collection('direct_messages').push(olderDirect, newerDirect)
  const markConversationRead = routes.get('POST /api/thiscord/conversations/{id}/read')
  assert.throws(
    () => markConversationRead(event({
      app: fixture.app,
      auth,
      body: { lastMessage: '' },
      path: { id: conversation.id },
    })),
    /invalid lastMessage/i,
  )
  markConversationRead(event({
    app: fixture.app,
    auth,
    body: { lastMessage: newerDirect.id },
    path: { id: conversation.id },
  }))
  markConversationRead(event({
    app: fixture.app,
    auth,
    body: { lastMessage: olderDirect.id },
    path: { id: conversation.id },
  }))
  assert.equal(membership.getString('lastMessage'), newerDirect.id)
})

test('community search and unread summary honor channel overwrite grants', () => {
  const auth = record('users', 'overwrite-reader')
  const fixture = communityFixture({
    userId: auth.id,
    permissions: [],
  })
  fixture.app.collection('channel_permissions').push(record(
    'channel_permissions',
    'member-read-grant',
    {
      channel: fixture.channel.id,
      targetType: 'member',
      targetId: fixture.membership.id,
      allow: ['view_channels', 'read_history'],
      deny: [],
    },
  ))
  const message = record('messages', 'overwrite-message', {
    channel: fixture.channel.id,
    author: 'another-user',
    content: 'searchable message',
    deletedAt: '',
    created: '2026-07-27 10:00:00.000Z',
  })
  fixture.app.collection('messages').push(message)

  const search = routes.get('GET /api/thiscord/communities/{id}/search')
  const searchResponse = search(event({
    app: fixture.app,
    auth,
    path: { id: fixture.community.id },
    query: { q: 'searchable', channel: fixture.channel.id },
  }))
  assert.deepEqual(searchResponse.value.items.map((item) => item.id), [message.id])

  const unread = routes.get('GET /api/thiscord/communities/{id}/unread-summary')
  const unreadResponse = unread(event({
    app: fixture.app,
    auth,
    path: { id: fixture.community.id },
  }))
  assert.deepEqual(unreadResponse.value.items.map((item) => item.message), [message.id])
})

test('global search keeps nickname-only people and ranks direct messages globally', () => {
  const auth = record('users', 'global-search-auth', {
    displayName: 'Current User',
    handle: 'current',
  })
  const nicknameMatch = record('users', 'global-search-person', {
    displayName: 'Unrelated Name',
    handle: 'unrelated',
  })
  const community = record('communities', 'global-search-community', { owner: auth.id })
  const ownCommunityMembership = record('memberships', 'global-search-own-membership', {
    community: community.id,
    user: auth.id,
    state: 'active',
  })
  const matchingCommunityMembership = record('memberships', 'global-search-matching-membership', {
    community: community.id,
    user: nicknameMatch.id,
    state: 'active',
    nickname: 'Needle Nickname',
  })
  const conversations = [
    record('conversations', 'global-search-conversation-a', { owner: auth.id }),
    record('conversations', 'global-search-conversation-b', { owner: auth.id }),
  ]
  const conversationMembers = conversations.map((conversation, index) => (
    record('conversation_members', `global-search-conversation-member-${index}`, {
      conversation: conversation.id,
      user: auth.id,
    })
  ))
  const directMessages = conversations.flatMap((conversation, conversationIndex) => (
    Array.from({ length: 11 }, (_, messageIndex) => record(
      'direct_messages',
      `global-search-direct-${conversationIndex}-${messageIndex}`,
      {
        conversation: conversation.id,
        author: auth.id,
        content: 'needle',
        created: `2026-01-${String(conversationIndex * 11 + messageIndex + 1).padStart(2, '0')}`,
        deletedAt: '',
      },
    ))
  ))
  const app = new MemoryApp({
    users: [auth, nicknameMatch],
    communities: [community],
    memberships: [ownCommunityMembership, matchingCommunityMembership],
    conversations,
    conversation_members: conversationMembers,
    direct_messages: directMessages,
  })

  const response = routes.get('GET /api/thiscord/search')(event({
    app,
    auth,
    query: { q: 'needle' },
  }))
  assert.deepEqual(response.value.people.map((user) => user.id), [nicknameMatch.id])
  assert.equal(response.value.directMessages.length, 22)
  assert.equal(response.value.directMessages[0].id, 'global-search-direct-1-10')
})

test('conversation creation requires an explicit kind with matching membership cardinality', () => {
  const creator = record('users', 'creator')
  const second = record('users', 'second')
  const third = record('users', 'third')
  const app = new MemoryApp({
    users: [creator, second, third],
    conversations: [],
    conversation_members: [],
  })
  const handler = routes.get('POST /api/thiscord/conversations')

  assert.throws(
    () => handler(event({ app, auth: creator, body: { userIds: [second.id] } })),
    /invalid conversation type/i,
  )
  assert.throws(
    () => handler(event({
      app,
      auth: creator,
      body: { kind: 'direct', userIds: [second.id, third.id] },
    })),
    /exactly two members/i,
  )
  assert.throws(
    () => handler(event({
      app,
      auth: creator,
      body: { kind: 'group', userIds: [second.id] },
    })),
    /at least three members/i,
  )

  const direct = handler(event({
    app,
    auth: creator,
    body: { kind: 'direct', userIds: [second.id] },
  }))
  assert.equal(direct.status, 201)
  assert.equal(direct.value.getString('kind'), 'direct')

  const group = handler(event({
    app,
    auth: creator,
    body: { kind: 'group', userIds: [second.id, third.id], name: 'Explicit group' },
  }))
  assert.equal(group.status, 201)
  assert.equal(group.value.getString('kind'), 'group')
})

test('concurrent group additions cannot exceed the canonical member cap', () => {
  const existingUsers = Array.from({ length: 24 }, (_, index) => (
    record('users', `group-member-${index}`)
  ))
  const target = record('users', 'group-target')
  const competing = record('users', 'group-competing')
  const conversation = record('conversations', 'bounded-group', {
    kind: 'group',
    owner: existingUsers[0].id,
  })
  const app = new MemoryApp({
    users: [...existingUsers, target, competing],
    conversations: [conversation],
    conversation_members: existingUsers.map((user, index) => record(
      'conversation_members',
      `bounded-member-${index}`,
      { conversation: conversation.id, user: user.id },
    )),
  })
  const save = app.save.bind(app)
  app.save = (candidate) => {
    if (
      candidate.collection().name === 'conversation_members'
      && candidate.getString('user') === target.id
    ) {
      save(record('conversation_members', 'concurrent-winner', {
        conversation: conversation.id,
        user: competing.id,
      }))
      throw new Error('conversation member limit trigger')
    }
    return save(candidate)
  }

  assert.throws(
    () => routes.get('POST /api/thiscord/conversations/{id}/members')(event({
      app,
      auth: existingUsers[0],
      body: { userId: target.id },
      path: { id: conversation.id },
    })),
    /at most 25 members/i,
  )
  assert.equal(app.collection('conversation_members').length, 25)
})

test('group rename reauthorizes the current owner inside the transaction', () => {
  const owner = record('users', 'rename-owner')
  const successor = record('users', 'rename-successor')
  const conversation = record('conversations', 'rename-group', {
    kind: 'group',
    name: 'Original',
    owner: owner.id,
  })
  const app = new MemoryApp({
    users: [owner, successor],
    conversations: [conversation],
    conversation_members: [
      record('conversation_members', 'rename-owner-member', {
        conversation: conversation.id,
        user: owner.id,
      }),
      record('conversation_members', 'rename-successor-member', {
        conversation: conversation.id,
        user: successor.id,
      }),
    ],
  })
  const runInTransaction = app.runInTransaction.bind(app)
  app.runInTransaction = (callback) => {
    conversation.set('owner', successor.id)
    return runInTransaction(callback)
  }

  assert.throws(
    () => routes.get('PATCH /api/thiscord/conversations/{id}')(event({
      app,
      auth: owner,
      body: { name: 'Stale rename' },
      path: { id: conversation.id },
    })),
    /only the group owner/i,
  )
  assert.equal(conversation.getString('name'), 'Original')
  assert.equal(conversation.getString('owner'), successor.id)
})

test('concurrent direct creation returns the unique-key race winner', () => {
  const creator = record('users', 'race-creator')
  const second = record('users', 'race-second')
  const app = new MemoryApp({
    users: [creator, second],
    conversations: [],
    conversation_members: [],
  })
  app.runInTransaction = () => {
    app.save(record('conversations', 'race-winner', {
      kind: 'direct',
      directKey: [creator.id, second.id].sort().join(':'),
      owner: second.id,
    }))
    throw new Error('UNIQUE constraint failed: conversations.directKey')
  }

  const response = routes.get('POST /api/thiscord/conversations')(event({
    app,
    auth: creator,
    body: { kind: 'direct', userIds: [second.id] },
  }))

  assert.equal(response.status, 200)
  assert.equal(response.value.id, 'race-winner')
})

test('Jitsi token issuance is target-authorized, five minutes, and permission-derived', () => {
  const fixture = communityFixture({
    userId: 'owner',
    ownerId: 'owner',
    channelKind: 'voice',
  })
  const auth = record('users', 'owner', {
    displayName: 'Owner',
    handle: 'owner',
    email: 'owner@example.test',
    avatar: 'owner.png',
  })
  const environment = {
    JITSI_DOMAIN: 'https://meet.example.test/path',
    JITSI_URL: 'https://media.example.test/',
    JITSI_APP_ID: 'thiscord',
    JITSI_APP_SECRET: 'secret',
    JITSI_CONTROL_URL: 'http://prosody.test/call-control',
    THISCORD_PUBLIC_URL: 'https://chat.example.test',
    POCKETBASE_PUBLIC_URL: 'https://api.example.test',
  }
  globalThis.$os.getenv = (name) => environment[name] || ''
  let signed
  globalThis.$security.createJWT = (claims, secret, seconds) => {
    signed = { claims, secret, seconds }
    return 'signed-token'
  }
  const handler = routes.get('GET /api/thiscord/calls/{kind}/{id}/join')
  const before = Date.now()
  const response = handler(event({
    app: fixture.app,
    auth,
    path: { kind: 'channel', id: fixture.channel.id },
  }))

  assert.equal(response.status, 200)
  assert.equal(response.value.roomName, 'opaque-room')
  assert.equal(response.value.jwt, 'signed-token')
  assert.equal('moderator' in response.value, false)
  assert.equal(response.value.canSpeak, true)
  assert.equal(response.value.canStreamVideo, true)
  assert.equal(signed.secret, 'secret')
  assert.equal(signed.seconds, 300)
  assert.equal(signed.claims.room, 'opaque-room')
  assert.equal(signed.claims.moderator, false)
  assert.equal(signed.claims.context.user.moderator, false)
  assert.equal('email' in signed.claims.context.user, false)
  assert.equal(
    signed.claims.context.user.avatar,
    'https://api.example.test/api/files/users/owner/owner.png?thumb=128x128',
  )
  assert.equal(signed.claims.context.features.recording, false)
  assert.equal(signed.claims.context.user.thiscordCanSpeak, true)
  assert.equal(signed.claims.context.user.thiscordCanStreamVideo, true)
  assert.equal(signed.claims.context.user.thiscordTokenVersion, 1)
  const tokenState = fixture.app.collection('call_token_versions')[0]
  assert.equal(tokenState.getString('room'), fixture.callRoom.id)
  assert.equal(tokenState.getString('user'), auth.id)
  assert.equal(tokenState.getInt('version'), 1)
  const lifetime = new Date(response.value.expiresAt).getTime() - before
  assert.ok(lifetime >= 299_000 && lifetime <= 301_000)
  handler(event({
    app: fixture.app,
    auth,
    path: { kind: 'channel', id: fixture.channel.id },
  }))
  assert.equal(signed.claims.context.user.thiscordTokenVersion, 2)
  assert.equal(tokenState.getInt('version'), 2)

  fixture.channel.set('kind', 'text')
  assert.throws(
    () => handler(event({ app: fixture.app, auth, path: { kind: 'channel', id: fixture.channel.id } })),
    /does not support calls/i,
  )

  const denied = communityFixture({
    permissions: ['view_channels'],
    channelKind: 'voice',
  })
  const member = record('users', 'member', { email: 'member@example.test' })
  assert.throws(
    () => handler(event({ app: denied.app, auth: member, path: { kind: 'channel', id: denied.channel.id } })),
    /missing permission: connect_voice/i,
  )

  assert.equal(routes.has('GET /api/thiscord/channels/{id}/jitsi-token'), false)
  assert.equal(routes.has('POST /api/thiscord/channels/{id}/call-presence'), false)
  const conversation = record('conversations', 'conversation', {
    kind: 'direct',
    owner: auth.id,
  })
  fixture.app.collection('conversations').push(conversation)
  fixture.app.collection('conversation_members').push(record('conversation_members', 'conversation-member', {
    conversation: conversation.id,
    user: auth.id,
  }))
  const conversationResponse = handler(event({
    app: fixture.app,
    auth,
    path: { kind: 'conversation', id: conversation.id },
  }))
  assert.equal(conversationResponse.status, 200)
  assert.equal(conversationResponse.value.canSpeak, true)
  assert.equal(conversationResponse.value.canStreamVideo, true)
  assert.equal('moderator' in conversationResponse.value, false)
  assert.equal(fixture.app.collection('call_rooms').filter((room) => (
    room.getString('conversation') === conversation.id
  )).length, 1)
  assert.throws(
    () => handler(event({
      app: fixture.app,
      auth: record('users', 'outsider'),
      path: { kind: 'conversation', id: conversation.id },
    })),
    /not a member of this conversation/i,
  )
})

test('call moderation is backend-authorized and never delegates Jitsi moderator power', () => {
  const fixture = communityFixture({
    userId: 'owner',
    ownerId: 'owner',
    channelKind: 'voice',
  })
  const actor = record('users', 'owner')
  const target = record('users', 'target')
  const call = record('call_sessions', 'active-call', {
    room: fixture.callRoom.id,
    endedAt: '',
  })
  fixture.app.collection('call_sessions').push(call)
  fixture.app.collection('call_participants').push(record('call_participants', 'target-participant', {
    call: call.id,
    user: target.id,
    leftAt: '',
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  }))
  let request
  globalThis.$os.getenv = (name) => ({
    JITSI_APP_SECRET: 'control-secret',
    JITSI_CONTROL_URL: 'http://prosody.test/thiscord-call-control',
  })[name] || ''
  globalThis.$http.send = (value) => {
    request = value
    return { statusCode: 200, raw: '{"affected":1}' }
  }

  const response = routes.get('POST /api/thiscord/calls/{kind}/{id}/moderate')(event({
    app: fixture.app,
    auth: actor,
    body: { userId: target.id, action: 'mute' },
    path: { kind: 'channel', id: fixture.channel.id },
  }))
  assert.equal(response.status, 200)
  assert.deepEqual(JSON.parse(request.body), {
    roomName: 'opaque-room',
    userIds: [target.id],
    action: 'mute',
  })
  const kicked = routes.get('POST /api/thiscord/calls/{kind}/{id}/moderate')(event({
    app: fixture.app,
    auth: actor,
    body: { userId: target.id, action: 'kick' },
    path: { kind: 'channel', id: fixture.channel.id },
  }))
  assert.equal(kicked.status, 200)
  assert.notEqual(
    fixture.app.findRecordById('call_participants', 'target-participant').getString('leftAt'),
    '',
  )
  assert.notEqual(call.getString('endedAt'), '')
  assert.throws(
    () => routes.get('POST /api/thiscord/calls/{kind}/{id}/moderate')(event({
      app: fixture.app,
      auth: actor,
      body: { userId: actor.id, action: 'kick' },
      path: { kind: 'channel', id: fixture.channel.id },
    })),
    /cannot moderate yourself/i,
  )

  const racingFixture = communityFixture({
    userId: 'moderator',
    permissions: ['view_channels', 'connect_voice', 'mute_members'],
    channelKind: 'voice',
  })
  const racingActor = record('users', 'moderator')
  const racingCall = record('call_sessions', 'racing-call', {
    room: racingFixture.callRoom.id,
    endedAt: '',
  })
  racingFixture.app.collection('call_sessions').push(racingCall)
  racingFixture.app.collection('call_participants').push(record('call_participants', 'racing-target', {
    call: racingCall.id,
    user: target.id,
    leftAt: '',
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  }))
  const racingTransaction = racingFixture.app.runInTransaction.bind(racingFixture.app)
  racingFixture.app.runInTransaction = (callback) => {
    racingFixture.everyone.set('permissions', ['view_channels', 'connect_voice'])
    return racingTransaction(callback)
  }
  request = null
  assert.throws(
    () => routes.get('POST /api/thiscord/calls/{kind}/{id}/moderate')(event({
      app: racingFixture.app,
      auth: racingActor,
      body: { userId: target.id, action: 'mute' },
      path: { kind: 'channel', id: racingFixture.channel.id },
    })),
    /mute_members/i,
  )
  assert.equal(request, null)
})

test('call occupancy reuses active records, refreshes expiry, and ends when empty', () => {
  const fixture = communityFixture({
    userId: 'owner',
    ownerId: 'owner',
    channelKind: 'voice',
  })
  const auth = record('users', 'owner', { email: 'owner@example.test' })
  const handler = routes.get('POST /api/thiscord/calls/{kind}/{id}/presence')
  let sequence = 0
  const join = () => handler(event({
    app: fixture.app,
    auth,
    body: {
      state: 'joined',
      leaseId: 'device-one',
      sequence: ++sequence,
      muted: true,
      camera: false,
      sharing: false,
    },
    path: { kind: 'channel', id: fixture.channel.id },
  }))

  const first = join()
  assert.equal(first.value.active, true)
  assert.equal(fixture.app.collection('call_sessions').length, 1)
  assert.equal(first.value.call.getString('room'), fixture.callRoom.id)
  assert.equal(fixture.app.collection('call_participants').length, 1)
  const firstExpiry = first.value.participant.getString('expiresAt')
  const second = join()
  assert.equal(second.value.call.id, first.value.call.id)
  assert.equal(second.value.participant.id, first.value.participant.id)
  assert.equal(fixture.app.collection('call_participants').length, 1)
  assert.ok(second.value.participant.getString('expiresAt') >= firstExpiry)

  const left = handler(event({
    app: fixture.app,
    auth,
    body: { state: 'left', leaseId: 'device-one', sequence: ++sequence },
    path: { kind: 'channel', id: fixture.channel.id },
  }))
  assert.equal(left.value.active, false)
  assert.ok(first.value.participant.getString('leftAt'))
  assert.ok(first.value.call.getString('endedAt'))
})

test('account presence leases reject late writes and update last seen only after the final lease', () => {
  const auth = record('users', 'presence-user', { lastSeenAt: 'before' })
  const app = new MemoryApp({
    users: [auth],
    presence: [],
    presence_leases: [],
  })
  const handler = routes.get('POST /api/thiscord/presence')
  const send = (leaseId, sequence, status) => handler(event({
    app,
    auth,
    body: { leaseId, sequence, status },
  }))

  send('desktop', 1, 'online')
  send('phone', 1, 'idle')
  assert.equal(app.collection('presence').length, 1)
  send('desktop', 2, 'offline')
  assert.equal(app.collection('presence')[0].getString('status'), 'idle')
  assert.equal(auth.getString('lastSeenAt'), 'before')
  send('phone', 3, 'offline')
  const finalLastSeen = auth.getString('lastSeenAt')
  assert.notEqual(finalLastSeen, 'before')
  const late = send('phone', 2, 'online')
  assert.equal(late.value.accepted, false)
  assert.equal(late.value.status, 'offline')
  assert.equal(app.collection('presence').length, 0)
  assert.equal(auth.getString('lastSeenAt'), finalLastSeen)

  assert.throws(
    () => send('invalid', 1, 'definitely-online'),
    /invalid presence status/i,
  )
})

test('a late call update cannot recreate a participant after its lease leaves', () => {
  const fixture = communityFixture({
    userId: 'lease-user',
    permissions: ['view_channels', 'connect_voice'],
    channelKind: 'voice',
  })
  const auth = record('users', 'lease-user')
  const handler = routes.get('POST /api/thiscord/calls/{kind}/{id}/presence')
  const send = (state, sequence) => handler(event({
    app: fixture.app,
    auth,
    body: { state, leaseId: 'page-call', sequence },
    path: { kind: 'channel', id: fixture.channel.id },
  }))

  send('joined', 1)
  send('left', 3)
  const late = send('update', 2)
  assert.equal(late.value.accepted, false)
  assert.equal(late.value.active, false)
  assert.equal(
    fixture.app.collection('call_participants').filter((item) => !item.getString('leftAt')).length,
    0,
  )
  assert.equal(
    fixture.app.collection('call_sessions').filter((item) => !item.getString('endedAt')).length,
    0,
  )
})

test('call presence reauthorizes inside the write transaction', () => {
  const fixture = communityFixture({
    permissions: ['view_channels', 'connect_voice'],
    channelKind: 'voice',
  })
  const auth = record('users', 'member')
  const runInTransaction = fixture.app.runInTransaction.bind(fixture.app)
  fixture.app.runInTransaction = (callback) => {
    fixture.membership.set('state', 'left')
    return runInTransaction(callback)
  }

  assert.throws(
    () => routes.get('POST /api/thiscord/calls/{kind}/{id}/presence')(event({
      app: fixture.app,
      auth,
      body: { state: 'joined', leaseId: 'stale-device', sequence: 1 },
      path: { kind: 'channel', id: fixture.channel.id },
    })),
    /active member/i,
  )
  assert.equal(fixture.app.collection('call_sessions').length, 0)
  assert.equal(fixture.app.collection('call_participants').length, 0)
})

test('simultaneous first joins recover active-call and active-participant uniqueness races', () => {
  const handler = routes.get('POST /api/thiscord/calls/{kind}/{id}/presence')
  const auth = record('users', 'member')
  const join = (app, channelId, leaseId) => handler(event({
    app,
    auth,
    body: {
      state: 'joined',
      leaseId,
      sequence: 1,
    },
    path: { kind: 'channel', id: channelId },
  }))

  const callRace = communityFixture({
    permissions: ['view_channels', 'connect_voice'],
    channelKind: 'voice',
  })
  callRace.app.collection('call_sessions')
  callRace.app.collection('call_participants')
  const saveCallRace = callRace.app.save.bind(callRace.app)
  let loseCallCreate = true
  callRace.app.save = (candidate) => {
    if (loseCallCreate && candidate.collection().name === 'call_sessions') {
      loseCallCreate = false
      saveCallRace(record('call_sessions', 'winning-call', {
        room: callRace.callRoom.id,
        startedBy: auth.id,
        endedAt: '',
      }))
      throw new Error('UNIQUE active call')
    }
    return saveCallRace(candidate)
  }
  const recoveredCall = join(callRace.app, callRace.channel.id, 'laptop')
  assert.equal(recoveredCall.value.call.id, 'winning-call')
  assert.equal(recoveredCall.value.participant.getString('user'), auth.id)

  const participantRace = communityFixture({
    permissions: ['view_channels', 'connect_voice'],
    channelKind: 'voice',
  })
  const activeCall = record('call_sessions', 'active-call', {
    room: participantRace.callRoom.id,
    startedBy: auth.id,
    endedAt: '',
  })
  participantRace.app.collection('call_sessions').push(activeCall)
  participantRace.app.collection('call_participants')
  const saveParticipantRace = participantRace.app.save.bind(participantRace.app)
  let loseParticipantCreate = true
  participantRace.app.save = (candidate) => {
    if (loseParticipantCreate && candidate.collection().name === 'call_participants') {
      loseParticipantCreate = false
      const expiresAt = new Date(Date.now() + 60_000).toISOString()
      saveParticipantRace(record('call_participants', 'winning-participant', {
        call: activeCall.id,
        user: auth.id,
        joinedAt: new Date().toISOString(),
        leftAt: '',
        expiresAt,
        devices: {
          phone: {
            expiresAt,
            muted: true,
            deafened: false,
            camera: false,
            sharing: false,
          },
        },
      }))
      throw new Error('UNIQUE active participant')
    }
    return saveParticipantRace(candidate)
  }
  const recoveredParticipant = join(participantRace.app, participantRace.channel.id, 'desktop')
  assert.equal(recoveredParticipant.value.participant.id, 'winning-participant')
  assert.deepEqual(
    Object.keys(recoveredParticipant.value.participant.get('devices')).sort(),
    ['desktop', 'phone'],
  )
})

test('conversation calls notify eligible members and aggregate simultaneous devices', () => {
  const caller = record('users', 'caller', {
    status: 'online',
    preferences: {},
  })
  const member = record('users', 'member', {
    status: 'online',
    preferences: {},
  })
  const mutedMember = record('users', 'muted-member', {
    status: 'online',
    preferences: { mutedConversations: ['conversation'] },
  })
  const dndMember = record('users', 'dnd-member', {
    status: 'dnd',
    preferences: { presenceStatus: 'dnd' },
  })
  const conversation = record('conversations', 'conversation', {
    kind: 'direct',
    owner: caller.id,
  })
  const app = new MemoryApp({
    users: [caller, member, mutedMember, dndMember],
    conversations: [conversation],
    conversation_members: [
      record('conversation_members', 'caller-member', { conversation: conversation.id, user: caller.id }),
      record('conversation_members', 'other-member', { conversation: conversation.id, user: member.id }),
      record('conversation_members', 'muted-membership', { conversation: conversation.id, user: mutedMember.id }),
      record('conversation_members', 'dnd-membership', { conversation: conversation.id, user: dndMember.id }),
    ],
    call_rooms: [],
    call_sessions: [],
    call_participants: [],
    notifications: [],
  })
  const handler = routes.get('POST /api/thiscord/calls/{kind}/{id}/presence')
  const sequences = new Map()
  const presence = (leaseId, state, media = {}) => {
    const sequence = (sequences.get(leaseId) ?? 0) + 1
    sequences.set(leaseId, sequence)
    return handler(event({
      app,
      auth: caller,
      body: {
        state,
        leaseId,
        sequence,
        muted: true,
        camera: false,
        sharing: false,
        ...media,
      },
      path: { kind: 'conversation', id: conversation.id },
    }))
  }

  const first = presence('laptop', 'joined', { muted: false, camera: true })
  const second = presence('phone', 'joined')
  assert.equal(first.value.call.id, second.value.call.id)
  assert.equal(first.value.participant.id, second.value.participant.id)
  assert.deepEqual(Object.keys(second.value.participant.get('devices')).sort(), ['laptop', 'phone'])
  assert.equal(second.value.participant.getBool('muted'), false)
  assert.equal(second.value.participant.getBool('camera'), true)
  assert.equal(app.collection('notifications').length, 1)
  assert.equal(app.collection('notifications')[0].getString('type'), 'conversation_call')
  assert.equal(app.collection('notifications')[0].getString('user'), member.id)

  const laptopLeft = presence('laptop', 'left')
  assert.equal(laptopLeft.value.active, true)
  assert.equal(first.value.participant.getBool('muted'), true)
  assert.equal(first.value.participant.getBool('camera'), false)
  assert.equal(first.value.participant.getString('leftAt'), '')
  const phoneLeft = presence('phone', 'left')
  assert.equal(phoneLeft.value.active, false)
  assert.ok(first.value.participant.getString('leftAt'))
  assert.ok(first.value.call.getString('endedAt'))
})

test('group membership changes revoke call presence and preserve ownership transfer', () => {
  const owner = record('users', 'owner')
  const member = record('users', 'member')
  const survivor = record('users', 'survivor')
  const conversation = record('conversations', 'group', {
    kind: 'group',
    name: 'Group',
    owner: owner.id,
  })
  const app = new MemoryApp({
    users: [owner, member, survivor],
    conversations: [conversation],
    conversation_members: [
      record('conversation_members', 'owner-membership', { conversation: conversation.id, user: owner.id, created: '1' }),
      record('conversation_members', 'member-membership', { conversation: conversation.id, user: member.id, created: '2' }),
      record('conversation_members', 'survivor-membership', { conversation: conversation.id, user: survivor.id, created: '3' }),
    ],
    call_rooms: [],
    call_sessions: [],
    call_participants: [],
    notifications: [],
  })
  const presence = routes.get('POST /api/thiscord/calls/{kind}/{id}/presence')
  const remove = routes.get('DELETE /api/thiscord/conversations/{id}/members/{userId}')
  const joined = presence(event({
    app,
    auth: owner,
    body: {
      state: 'joined',
      leaseId: 'owner-device',
      sequence: 1,
      jitsiId: member.id,
    },
    path: { kind: 'conversation', id: conversation.id },
  }))
  assert.equal(
    'jitsiId' in joined.value.participant.get('devices')['owner-device'],
    false,
  )
  app.collection('call_token_versions').push(record('call_token_versions', 'owner-token', {
    room: joined.value.call.getString('room'),
    user: owner.id,
    version: 1,
    expiresAt: new Date(Date.now() + 300_000).toISOString(),
  }))
  const controlRequests = []
  globalThis.$os.getenv = (name) => ({
    JITSI_APP_SECRET: 'control-secret',
    JITSI_CONTROL_URL: 'http://prosody.test/thiscord-call-control',
  })[name] || ''
  globalThis.$http.send = (request) => {
    controlRequests.push(request)
    return { statusCode: 200, raw: '{"kicked":1}' }
  }

  remove(event({
    app,
    auth: owner,
    path: { id: conversation.id, userId: owner.id },
  }))

  assert.equal(conversation.getString('owner'), member.id)
  assert.ok(joined.value.participant.getString('leftAt'))
  assert.ok(joined.value.call.getString('endedAt'))
  assert.equal(controlRequests.length, 2)
  assert.equal(controlRequests[0].method, 'PUT')
  assert.equal(controlRequests[0].headers.authorization, 'Bearer control-secret')
  const revokeRequest = JSON.parse(controlRequests[0].body)
  assert.equal(revokeRequest.action, 'revoke')
  assert.equal(revokeRequest.tokenVersion, 1)
  const kickRequest = JSON.parse(controlRequests[1].body)
  assert.deepEqual(kickRequest, {
    roomName: 'opaque-room',
    userIds: [owner.id],
    action: 'kick',
  })
  assert.equal(app.collection('conversation_members').some((item) => item.getString('user') === owner.id), false)
})

test('ownership transfer revalidates the target administrator inside the transaction', () => {
  const fixture = communityFixture({
    userId: 'target',
    ownerId: 'owner',
    permissions: ['administrator'],
  })
  const auth = record('users', 'owner')
  const runInTransaction = fixture.app.runInTransaction.bind(fixture.app)
  fixture.app.runInTransaction = (callback) => {
    fixture.membership.set('state', 'left')
    return runInTransaction(callback)
  }

  assert.throws(
    () => routes.get('POST /api/thiscord/communities/{id}/transfer')(event({
      app: fixture.app,
      auth,
      body: { userId: 'target' },
      path: { id: fixture.community.id },
    })),
    /active member/i,
  )
  assert.equal(fixture.community.getString('owner'), 'owner')
})

test('transient cleanup expires stale participants and ends empty calls', () => {
  const call = record('call_sessions', 'stale-call', { endedAt: '' })
  const participant = record('call_participants', 'stale-participant', {
    call: call.id,
    leftAt: '',
    expiresAt: new Date(Date.now() - 60_000).toISOString(),
  })
  const app = new MemoryApp({
    presence: [],
    typing: [],
    direct_typing: [],
    call_sessions: [call],
    call_participants: [participant],
  })

  loadLifecycleCron()(app)

  assert.ok(participant.getString('leftAt'))
  assert.equal(participant.getString('expiresAt'), '')
  assert.ok(call.getString('endedAt'))
})

test('transient cleanup turns expired presence leases into tombstones and records final last seen', () => {
  const user = record('users', 'expired-presence-user', { lastSeenAt: 'before' })
  const aggregate = record('presence', 'expired-presence', {
    user: user.id,
    status: 'online',
  })
  const lease = record('presence_leases', 'expired-presence-lease', {
    user: user.id,
    leaseId: 'expired-page',
    sequence: 4,
    status: 'online',
    expiresAt: new Date(Date.now() - 60_000).toISOString(),
    closedAt: '',
  })
  const app = new MemoryApp({
    users: [user],
    presence: [aggregate],
    presence_leases: [lease],
    typing: [],
    direct_typing: [],
    call_sessions: [],
    call_participants: [],
  })

  loadLifecycleCron()(app)

  assert.equal(app.collection('presence').length, 0)
  assert.ok(lease.getString('closedAt'))
  assert.equal(lease.getString('status'), 'offline')
  assert.notEqual(user.getString('lastSeenAt'), 'before')
})

test('account deletion removes private roots and transfers retained ownership', () => {
  const gone = record('users', 'gone')
  const survivor = record('users', 'survivor')
  const ownedCommunity = record('communities', 'owned', { owner: gone.id })
  const retainedCommunity = record('communities', 'retained', { owner: survivor.id })
  const direct = record('conversations', 'direct', { kind: 'direct', owner: gone.id })
  const group = record('conversations', 'group', { kind: 'group', owner: gone.id })
  const voice = record('channels', 'voice', { community: retainedCommunity.id, kind: 'voice' })
  const room = record('call_rooms', 'room', {
    channel: voice.id,
    conversation: '',
    roomName: 'account-deletion-room',
  })
  const call = record('call_sessions', 'call', {
    room: room.id,
    startedBy: gone.id,
    endedAt: '',
  })
  const callParticipant = record('call_participants', 'call-participant', {
    call: call.id,
    user: gone.id,
    leftAt: '',
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    devices: { laptop: new Date(Date.now() + 60_000).toISOString() },
  })
  const ban = record('bans', 'ban', {
    community: retainedCommunity.id,
    moderator: gone.id,
  })
  const authored = record('messages', 'authored', { author: gone.id })
  const audit = record('audit_events', 'audit', { actor: gone.id })
  const app = new MemoryApp({
    users: [gone, survivor],
    communities: [ownedCommunity, retainedCommunity],
    conversations: [direct, group],
    conversation_members: [
      record('conversation_members', 'direct-gone', { conversation: direct.id, user: gone.id }),
      record('conversation_members', 'direct-survivor', { conversation: direct.id, user: survivor.id }),
      record('conversation_members', 'group-gone', { conversation: group.id, user: gone.id, created: '1' }),
      record('conversation_members', 'group-survivor', { conversation: group.id, user: survivor.id, created: '2' }),
    ],
    messages: [authored],
    direct_messages: [],
    invites: [],
    bans: [ban],
    channels: [voice],
    call_rooms: [room],
    call_sessions: [call],
    call_participants: [callParticipant],
    audit_events: [audit],
    notifications: [],
  })
  globalThis.$os.getenv = (name) => ({
    JITSI_APP_SECRET: 'control-secret',
    JITSI_CONTROL_URL: 'http://prosody.test/thiscord-call-control',
  })[name] || ''
  globalThis.$http.send = () => { throw new Error('media unavailable') }
  const handler = routes.get('DELETE /api/thiscord/account')
  const response = handler(event({ app, auth: gone }))

  assert.equal(response.status, 204)
  assert.equal(app.collection('users').some((item) => item.id === gone.id), false)
  assert.equal(app.collection('communities').some((item) => item.id === ownedCommunity.id), false)
  assert.equal(app.collection('conversations').some((item) => item.id === direct.id), false)
  assert.equal(group.getString('owner'), survivor.id)
  assert.equal(app.collection('messages').length, 0)
  assert.equal(ban.getString('moderator'), survivor.id)
  assert.equal(call.getString('startedBy'), survivor.id)
  assert.ok(call.getString('endedAt'))
  assert.ok(callParticipant.getString('leftAt'))
  assert.equal(audit.getString('actor'), '')
  assert.equal(app.collection('call_ejections').length, 1)
})

test('role mutations reauthorize hierarchy inside their transactions', () => {
  const auth = record('users', 'role-manager')
  const fixture = communityFixture({
    userId: auth.id,
    permissions: ['manage_roles'],
  })
  const protectedRole = record('roles', 'protected-role', {
    community: fixture.community.id,
    managed: false,
    position: 1,
    permissions: [],
  })
  fixture.app.collection('roles').push(protectedRole)
  assert.throws(
    () => routes.get('PUT /api/thiscord/communities/{id}/roles/order')(event({
      app: fixture.app,
      auth,
      body: { ids: [protectedRole.id] },
      path: { id: fixture.community.id },
    })),
    /cannot reorder/i,
  )

  const runInTransaction = fixture.app.runInTransaction.bind(fixture.app)
  fixture.app.runInTransaction = (callback) => {
    fixture.everyone.set('permissions', [])
    return runInTransaction(callback)
  }
  assert.throws(
    () => routes.get('PATCH /api/thiscord/roles/{id}')(event({
      app: fixture.app,
      auth,
      body: { name: 'Unauthorized rename' },
      path: { id: protectedRole.id },
    })),
    /manage_roles/i,
  )
  assert.equal(protectedRole.getString('name'), '')
})

test('invite acceptance cannot reactivate a concurrently banned member', () => {
  const auth = record('users', 'invite-race-user')
  const community = record('communities', 'invite-race-community', { owner: 'owner' })
  const invite = record('invites', 'invite-race', {
    community: community.id,
    code: 'race-code',
    revoked: false,
    maxUses: 1,
    uses: 0,
  })
  const app = new MemoryApp({
    users: [auth],
    communities: [community],
    invites: [invite],
    memberships: [],
    bans: [],
  })
  const runInTransaction = app.runInTransaction.bind(app)
  app.runInTransaction = (callback) => {
    app.collection('bans').push(record('bans', 'concurrent-ban', {
      community: community.id,
      user: auth.id,
      expiresAt: '',
    }))
    return runInTransaction(callback)
  }

  assert.throws(
    () => routes.get('POST /api/thiscord/invites/{code}/accept')(event({
      app,
      auth,
      path: { code: invite.getString('code') },
    })),
    /banned/i,
  )
  assert.equal(app.collection('memberships').length, 0)
  assert.equal(invite.getInt('uses'), 0)
})

test('channel overwrite writes reauthorize actor and target inside the transaction', () => {
  const auth = record('users', 'overwrite-manager')
  const fixture = communityFixture({
    userId: auth.id,
    permissions: ['manage_roles'],
  })
  const target = record('roles', 'overwrite-target', {
    community: fixture.community.id,
    managed: false,
    position: 0,
    permissions: [],
  })
  fixture.app.collection('roles').push(target)
  const runInTransaction = fixture.app.runInTransaction.bind(fixture.app)
  fixture.app.runInTransaction = (callback) => {
    fixture.everyone.set('permissions', [])
    return runInTransaction(callback)
  }

  assert.throws(
    () => routes.get('PUT /api/thiscord/channels/{id}/permissions')(event({
      app: fixture.app,
      auth,
      body: {
        targetType: 'role',
        targetId: target.id,
        allow: ['view_channels'],
        deny: [],
      },
      path: { id: fixture.channel.id },
    })),
    /manage_roles/i,
  )
  assert.equal(fixture.app.collection('channel_permissions').length, 0)
})

test('message mutations reauthorize membership inside their transactions', () => {
  const auth = record('users', 'message-race-user')
  const fixture = communityFixture({
    userId: auth.id,
    permissions: ['view_channels', 'read_history'],
  })
  const channelMessage = record('messages', 'message-race-channel', {
    channel: fixture.channel.id,
    author: auth.id,
    content: 'Original channel message',
    attachments: [],
  })
  fixture.app.collection('messages').push(channelMessage)
  const channelTransaction = fixture.app.runInTransaction.bind(fixture.app)
  fixture.app.runInTransaction = (callback) => {
    fixture.membership.set('state', 'left')
    return channelTransaction(callback)
  }
  assert.throws(
    () => routes.get('PATCH /api/thiscord/messages/{id}')(event({
      app: fixture.app,
      auth,
      body: { content: 'Stale channel edit' },
      path: { id: channelMessage.id },
    })),
    /active member/i,
  )
  assert.equal(channelMessage.getString('content'), 'Original channel message')

  const conversation = record('conversations', 'message-race-conversation', {
    kind: 'group',
    owner: 'conversation-owner',
  })
  const directMembership = record('conversation_members', 'message-race-membership', {
    conversation: conversation.id,
    user: auth.id,
  })
  const directMessage = record('direct_messages', 'message-race-direct', {
    conversation: conversation.id,
    author: auth.id,
    content: 'Original direct message',
    attachments: [],
  })
  const directApp = new MemoryApp({
    users: [auth],
    conversations: [conversation],
    conversation_members: [directMembership],
    direct_messages: [directMessage],
  })
  const directTransaction = directApp.runInTransaction.bind(directApp)
  directApp.runInTransaction = (callback) => {
    directApp.delete(directMembership)
    return directTransaction(callback)
  }
  assert.throws(
    () => routes.get('DELETE /api/thiscord/direct-messages/{id}')(event({
      app: directApp,
      auth,
      path: { id: directMessage.id },
    })),
    /not a member/i,
  )
  assert.equal(directMessage.getString('deletedAt'), '')
})

test('member role and nickname mutations revalidate the active target in their transactions', () => {
  const auth = record('users', 'member-race-manager')
  const rolesFixture = communityFixture({
    userId: auth.id,
    permissions: ['manage_roles'],
  })
  const target = record('memberships', 'member-race-target', {
    community: rolesFixture.community.id,
    user: 'member-race-user',
    state: 'active',
  })
  const assignable = record('roles', 'member-race-role', {
    community: rolesFixture.community.id,
    managed: false,
    position: 0,
    permissions: [],
  })
  rolesFixture.app.collection('memberships').push(target)
  rolesFixture.app.collection('roles').push(assignable)
  const rolesTransaction = rolesFixture.app.runInTransaction.bind(rolesFixture.app)
  rolesFixture.app.runInTransaction = (callback) => {
    target.set('state', 'banned')
    return rolesTransaction(callback)
  }

  assert.throws(
    () => routes.get('PUT /api/thiscord/memberships/{id}/roles')(event({
      app: rolesFixture.app,
      auth,
      body: { roleIds: [assignable.id] },
      path: { id: target.id },
    })),
    /active member/i,
  )
  assert.equal(rolesFixture.app.collection('member_roles').length, 0)

  const nicknameFixture = communityFixture({
    userId: auth.id,
    permissions: ['manage_members'],
  })
  const nicknameTarget = record('memberships', 'nickname-race-target', {
    community: nicknameFixture.community.id,
    user: 'nickname-race-user',
    state: 'active',
    nickname: 'Original',
  })
  nicknameFixture.app.collection('memberships').push(nicknameTarget)
  const nicknameTransaction = nicknameFixture.app.runInTransaction.bind(nicknameFixture.app)
  nicknameFixture.app.runInTransaction = (callback) => {
    nicknameTarget.set('state', 'left')
    return nicknameTransaction(callback)
  }

  assert.throws(
    () => routes.get('PATCH /api/thiscord/memberships/{id}')(event({
      app: nicknameFixture.app,
      auth,
      body: { nickname: 'Stale overwrite' },
      path: { id: nicknameTarget.id },
    })),
    /active member/i,
  )
  assert.equal(nicknameTarget.getString('nickname'), 'Original')
})

test('community updates reauthorize the current manager inside the transaction', () => {
  const auth = record('users', 'community-race-manager')
  const fixture = communityFixture({
    userId: auth.id,
    permissions: ['manage_community'],
  })
  fixture.community.set('name', 'Original')
  const runInTransaction = fixture.app.runInTransaction.bind(fixture.app)
  fixture.app.runInTransaction = (callback) => {
    fixture.everyone.set('permissions', [])
    return runInTransaction(callback)
  }

  assert.throws(
    () => routes.get('PATCH /api/thiscord/communities/{id}')(event({
      app: fixture.app,
      auth,
      body: { name: 'Stale update' },
      path: { id: fixture.community.id },
    })),
    /manage_community/i,
  )
  assert.equal(fixture.community.getString('name'), 'Original')
})

test('invite and unban mutations reauthorize inside their transactions', () => {
  const auth = record('users', 'invite-race-manager')
  const createFixture = communityFixture({
    userId: auth.id,
    permissions: ['create_invites'],
  })
  const createTransaction = createFixture.app.runInTransaction.bind(createFixture.app)
  createFixture.app.runInTransaction = (callback) => {
    createFixture.everyone.set('permissions', [])
    return createTransaction(callback)
  }
  assert.throws(
    () => routes.get('POST /api/thiscord/communities/{id}/invites')(event({
      app: createFixture.app,
      auth,
      path: { id: createFixture.community.id },
    })),
    /create_invites/i,
  )
  assert.equal(createFixture.app.collection('invites').length, 0)

  const revokeFixture = communityFixture({
    userId: auth.id,
    permissions: ['manage_community'],
  })
  const invite = record('invites', 'invite-race-revoke', {
    community: revokeFixture.community.id,
    creator: 'another-user',
    revoked: false,
  })
  revokeFixture.app.collection('invites').push(invite)
  const revokeTransaction = revokeFixture.app.runInTransaction.bind(revokeFixture.app)
  revokeFixture.app.runInTransaction = (callback) => {
    revokeFixture.everyone.set('permissions', [])
    return revokeTransaction(callback)
  }
  assert.throws(
    () => routes.get('DELETE /api/thiscord/invites/{id}')(event({
      app: revokeFixture.app,
      auth,
      path: { id: invite.id },
    })),
    /cannot revoke/i,
  )
  assert.equal(invite.getBool('revoked'), false)

  const unbanFixture = communityFixture({
    userId: auth.id,
    permissions: ['manage_members'],
  })
  const bannedMembership = record('memberships', 'unban-race-membership', {
    community: unbanFixture.community.id,
    user: 'banned-user',
    state: 'banned',
  })
  const ban = record('bans', 'unban-race-ban', {
    community: unbanFixture.community.id,
    user: bannedMembership.getString('user'),
  })
  unbanFixture.app.collection('memberships').push(bannedMembership)
  unbanFixture.app.collection('bans').push(ban)
  const unbanTransaction = unbanFixture.app.runInTransaction.bind(unbanFixture.app)
  unbanFixture.app.runInTransaction = (callback) => {
    unbanFixture.everyone.set('permissions', [])
    return unbanTransaction(callback)
  }
  assert.throws(
    () => routes.get('DELETE /api/thiscord/bans/{id}')(event({
      app: unbanFixture.app,
      auth,
      path: { id: ban.id },
    })),
    /manage_members/i,
  )
  assert.equal(unbanFixture.app.collection('bans').length, 1)
  assert.equal(bannedMembership.getString('state'), 'banned')
})

test('channel creation and ordering reauthorize and refetch inside their transactions', () => {
  const auth = record('users', 'channel-race-manager')
  const createFixture = communityFixture({
    userId: auth.id,
    permissions: ['manage_channels'],
  })
  const createTransaction = createFixture.app.runInTransaction.bind(createFixture.app)
  createFixture.app.runInTransaction = (callback) => {
    createFixture.everyone.set('permissions', [])
    return createTransaction(callback)
  }
  assert.throws(
    () => routes.get('POST /api/thiscord/communities/{id}/channels')(event({
      app: createFixture.app,
      auth,
      body: { name: 'stale-channel', kind: 'text' },
      path: { id: createFixture.community.id },
    })),
    /manage_channels/i,
  )
  assert.equal(createFixture.app.collection('channels').length, 1)

  const orderFixture = communityFixture({
    userId: auth.id,
    permissions: ['manage_channels'],
  })
  orderFixture.channel.set('position', 9)
  const orderTransaction = orderFixture.app.runInTransaction.bind(orderFixture.app)
  orderFixture.app.runInTransaction = (callback) => {
    orderFixture.everyone.set('permissions', [])
    return orderTransaction(callback)
  }
  assert.throws(
    () => routes.get('PUT /api/thiscord/communities/{id}/channels/order')(event({
      app: orderFixture.app,
      auth,
      body: { ids: [orderFixture.channel.id] },
      path: { id: orderFixture.community.id },
    })),
    /manage_channels/i,
  )
  assert.equal(orderFixture.channel.getInt('position'), 9)
})

test('channel writes enforce kind capabilities and category invariants', () => {
  const auth = record('users', 'channel-invariant-owner')
  const fixture = communityFixture({
    userId: auth.id,
    ownerId: auth.id,
    permissions: [],
  })
  const create = routes.get('POST /api/thiscord/communities/{id}/channels')
  const update = routes.get('PATCH /api/thiscord/channels/{id}')

  assert.throws(
    () => create(event({
      app: fixture.app,
      auth,
      body: {
        kind: 'category',
        name: 'Nested category',
        parent: fixture.channel.id,
      },
      path: { id: fixture.community.id },
    })),
    /parent field is not supported/i,
  )
  assert.throws(
    () => create(event({
      app: fixture.app,
      auth,
      body: {
        kind: 'voice',
        name: 'Invalid voice',
        slowmodeSeconds: 30,
      },
      path: { id: fixture.community.id },
    })),
    /slowmodeSeconds field is not supported/i,
  )

  fixture.channel.set('kind', 'category')
  fixture.channel.set('parent', fixture.channel.id)
  fixture.channel.set('topic', 'stale topic')
  fixture.channel.set('nsfw', true)
  fixture.channel.set('slowmodeSeconds', 30)
  update(event({
    app: fixture.app,
    auth,
    body: { name: 'Clean category' },
    path: { id: fixture.channel.id },
  }))
  assert.equal(fixture.channel.getString('parent'), '')
  assert.equal(fixture.channel.getString('topic'), '')
  assert.equal(fixture.channel.getBool('nsfw'), false)
  assert.equal(fixture.channel.getInt('slowmodeSeconds'), 0)

  fixture.channel.set('kind', 'text')
  assert.throws(
    () => update(event({
      app: fixture.app,
      auth,
      body: { parent: fixture.channel.id },
      path: { id: fixture.channel.id },
    })),
    /own category/i,
  )
})

test('invite codes are listed only through the permission-checked route', () => {
  const auth = record('users', 'invite-list-manager')
  const fixture = communityFixture({
    userId: auth.id,
    permissions: ['create_invites'],
  })
  const invite = record('invites', 'listed-invite', {
    community: fixture.community.id,
    creator: auth.id,
    code: 'sensitive-code',
    created: '2',
  })
  fixture.app.collection('invites').push(invite)
  const handler = routes.get('GET /api/thiscord/communities/{id}/invites')
  const response = handler(event({
    app: fixture.app,
    auth,
    path: { id: fixture.community.id },
  }))
  assert.deepEqual(response.value.items, [invite])
  assert.equal(response.value.hasMore, false)

  fixture.everyone.set('permissions', [])
  assert.throws(
    () => handler(event({
      app: fixture.app,
      auth,
      path: { id: fixture.community.id },
    })),
    /cannot view/i,
  )
})

test('typing upserts reauthorize in-transaction and recover concurrent first writes', () => {
  const auth = record('users', 'typing-race-user')
  const channelFixture = communityFixture({
    userId: auth.id,
    permissions: ['view_channels', 'send_messages'],
  })
  const channelTransaction = channelFixture.app.runInTransaction.bind(channelFixture.app)
  channelFixture.app.runInTransaction = (callback) => {
    channelFixture.everyone.set('permissions', ['view_channels'])
    return channelTransaction(callback)
  }
  assert.throws(
    () => routes.get('POST /api/thiscord/channels/{id}/typing')(event({
      app: channelFixture.app,
      auth,
      path: { id: channelFixture.channel.id },
    })),
    /send_messages/i,
  )
  assert.equal(channelFixture.app.collection('typing').length, 0)

  const conversation = record('conversations', 'typing-race-conversation', {
    kind: 'group',
    owner: auth.id,
  })
  const membership = record('conversation_members', 'typing-race-member', {
    conversation: conversation.id,
    user: auth.id,
  })
  const conversationApp = new MemoryApp({
    conversations: [conversation],
    conversation_members: [membership],
    direct_typing: [],
  })
  const conversationTransaction = conversationApp.runInTransaction.bind(conversationApp)
  conversationApp.runInTransaction = (callback) => {
    conversationApp.delete(membership)
    return conversationTransaction(callback)
  }
  assert.throws(
    () => routes.get('POST /api/thiscord/conversations/{id}/typing')(event({
      app: conversationApp,
      auth,
      path: { id: conversation.id },
    })),
    /not a member/i,
  )
  assert.equal(conversationApp.collection('direct_typing').length, 0)

  const recoveryFixture = communityFixture({
    userId: auth.id,
    permissions: ['view_channels', 'send_messages'],
  })
  const save = recoveryFixture.app.save.bind(recoveryFixture.app)
  let raced = false
  recoveryFixture.app.save = (candidate) => {
    if (candidate.collection().name === 'typing' && !candidate.id.startsWith('winner') && !raced) {
      raced = true
      recoveryFixture.app.collection('typing').push(record('typing', 'winner-typing', {
        channel: recoveryFixture.channel.id,
        user: auth.id,
        expiresAt: '',
      }))
      throw new Error('unique typing race')
    }
    return save(candidate)
  }
  const recovered = routes.get('POST /api/thiscord/channels/{id}/typing')(event({
    app: recoveryFixture.app,
    auth,
    path: { id: recoveryFixture.channel.id },
  }))
  assert.equal(recovered.status, 204)
  assert.equal(recoveryFixture.app.collection('typing').length, 1)
  assert.ok(recoveryFixture.app.collection('typing')[0].getString('expiresAt'))
})

test('invite preview is public and returns an authoritative active member count', () => {
  const community = record('communities', 'preview-community', {
    name: 'Preview community',
    description: 'Public metadata',
  })
  const invite = record('invites', 'preview-invite', {
    community: community.id,
    code: 'preview-code',
    revoked: false,
    expiresAt: '',
    maxUses: 0,
    uses: 0,
  })
  const app = new MemoryApp({
    communities: [community],
    invites: [invite],
    memberships: [
      record('memberships', 'preview-active-a', { community: community.id, state: 'active' }),
      record('memberships', 'preview-active-b', { community: community.id, state: 'active' }),
      record('memberships', 'preview-left', { community: community.id, state: 'left' }),
    ],
  })
  const response = routes.get('GET /api/thiscord/invites/{code}/preview')(event({
    app,
    path: { code: invite.getString('code') },
  }))
  assert.equal(response.status, 200)
  assert.equal(response.value.community.id, community.id)
  assert.equal(response.value.memberCount, 2)
})

test('channel and conversation history cursors remain stable while newer messages arrive', () => {
  const auth = record('users', 'cursor-user')
  const fixture = communityFixture({
    userId: auth.id,
    permissions: ['view_channels', 'read_history'],
  })
  const channelMessages = [
    record('messages', 'message-d', { channel: fixture.channel.id, created: '2026-01-04' }),
    record('messages', 'message-c', { channel: fixture.channel.id, created: '2026-01-03' }),
    record('messages', 'message-b', { channel: fixture.channel.id, created: '2026-01-02' }),
    record('messages', 'message-a', { channel: fixture.channel.id, created: '2026-01-01' }),
  ]
  fixture.app.collection('messages').push(...channelMessages)
  const channelHandler = routes.get('GET /api/thiscord/channels/{id}/messages')
  const first = channelHandler(event({
    app: fixture.app,
    auth,
    path: { id: fixture.channel.id },
    query: { perPage: '2' },
  }))
  assert.deepEqual(first.value.items.map((item) => item.id), ['message-d', 'message-c'])
  fixture.app.collection('messages').push(record('messages', 'message-e', {
    channel: fixture.channel.id,
    created: '2026-01-05',
  }))
  const second = channelHandler(event({
    app: fixture.app,
    auth,
    path: { id: fixture.channel.id },
    query: {
      perPage: '2',
      beforeCreated: first.value.nextCursor.created,
      beforeId: first.value.nextCursor.id,
    },
  }))
  assert.deepEqual(second.value.items.map((item) => item.id), ['message-b', 'message-a'])

  const conversation = record('conversations', 'cursor-conversation', { kind: 'direct', owner: auth.id })
  const membership = record('conversation_members', 'cursor-membership', {
    conversation: conversation.id,
    user: auth.id,
  })
  const directApp = new MemoryApp({
    users: [auth],
    conversations: [conversation],
    conversation_members: [membership],
    direct_messages: [
      record('direct_messages', 'direct-d', { conversation: conversation.id, created: '2026-01-04' }),
      record('direct_messages', 'direct-c', { conversation: conversation.id, created: '2026-01-03' }),
      record('direct_messages', 'direct-b', { conversation: conversation.id, created: '2026-01-02' }),
      record('direct_messages', 'direct-a', { conversation: conversation.id, created: '2026-01-01' }),
    ],
  })
  const directHandler = routes.get('GET /api/thiscord/conversations/{id}/messages')
  const directFirst = directHandler(event({
    app: directApp,
    auth,
    path: { id: conversation.id },
    query: { perPage: '2' },
  }))
  directApp.collection('direct_messages').push(record('direct_messages', 'direct-e', {
    conversation: conversation.id,
    created: '2026-01-05',
  }))
  const directSecond = directHandler(event({
    app: directApp,
    auth,
    path: { id: conversation.id },
    query: {
      perPage: '2',
      beforeCreated: directFirst.value.nextCursor.created,
      beforeId: directFirst.value.nextCursor.id,
    },
  }))
  assert.deepEqual(directSecond.value.items.map((item) => item.id), ['direct-b', 'direct-a'])
})

test('unread state compares persisted message pointers instead of receipt wall-clock time', () => {
  const auth = record('users', 'unread-pointer-user')
  const fixture = communityFixture({
    userId: auth.id,
    permissions: ['view_channels', 'read_history'],
  })
  const read = record('messages', 'read-pointer', {
    channel: fixture.channel.id,
    author: 'other',
    created: '2026-01-01',
    deletedAt: '',
  })
  const unseen = record('messages', 'unseen-pointer', {
    channel: fixture.channel.id,
    author: 'other',
    created: '2026-01-02',
    deletedAt: '',
  })
  fixture.app.collection('messages').push(read, unseen)
  fixture.app.collection('read_states').push(record('read_states', 'read-state', {
    channel: fixture.channel.id,
    user: auth.id,
    lastMessage: read.id,
    lastReadAt: '2030-01-01',
  }))
  const summary = routes.get('GET /api/thiscord/communities/{id}/unread-summary')(event({
    app: fixture.app,
    auth,
    path: { id: fixture.community.id },
  }))
  assert.deepEqual(summary.value.items.map((item) => item.message), [unseen.id])

  const conversation = record('conversations', 'unread-conversation', {
    kind: 'direct',
    owner: auth.id,
    updated: '2030-01-01',
  })
  const ownMembership = record('conversation_members', 'unread-conversation-member', {
    conversation: conversation.id,
    user: auth.id,
    lastMessage: 'direct-read',
    lastReadAt: '2030-01-01',
  })
  const directApp = new MemoryApp({
    users: [auth, record('users', 'unread-other')],
    conversations: [conversation],
    conversation_members: [ownMembership],
    direct_messages: [
      record('direct_messages', 'direct-read', {
        conversation: conversation.id,
        author: 'unread-other',
        created: '2026-01-01',
      }),
      record('direct_messages', 'direct-unseen', {
        conversation: conversation.id,
        author: 'unread-other',
        created: '2026-01-02',
        deletedAt: '',
      }),
      record('direct_messages', 'direct-deleted-newest', {
        conversation: conversation.id,
        author: 'unread-other',
        created: '2026-01-03',
        deletedAt: '2026-01-04',
      }),
    ],
  })
  const list = routes.get('GET /api/thiscord/conversations')(event({
    app: directApp,
    auth,
  }))
  assert.deepEqual(list.value.unreadConversationIds, [conversation.id])
  ownMembership.set('lastMessage', 'direct-unseen')
  const afterRead = routes.get('GET /api/thiscord/conversations')(event({
    app: directApp,
    auth,
  }))
  assert.deepEqual(afterRead.value.unreadConversationIds, [])
})

test('adjacent channel moves order the complete server-side channel set', () => {
  const auth = record('users', 'move-manager')
  const fixture = communityFixture({
    userId: auth.id,
    permissions: ['manage_channels', 'view_channels'],
  })
  fixture.channel.set('position', 0)
  const second = record('channels', 'move-second', {
    community: fixture.community.id,
    kind: 'text',
    position: 1,
  })
  const third = record('channels', 'move-third', {
    community: fixture.community.id,
    kind: 'text',
    position: 2,
  })
  fixture.app.collection('channels').push(second, third)
  const response = routes.get('POST /api/thiscord/channels/{id}/move')(event({
    app: fixture.app,
    auth,
    body: { direction: 1 },
    path: { id: second.id },
  }))
  assert.deepEqual(response.value.ids, [fixture.channel.id, third.id, second.id])
  assert.deepEqual(
    fixture.app.collection('channels').sort((left, right) => left.getInt('position') - right.getInt('position')).map((item) => item.id),
    [fixture.channel.id, third.id, second.id],
  )

  const channelOnly = communityFixture({
    userId: auth.id,
    permissions: ['view_channels'],
  })
  channelOnly.app.collection('channel_permissions').push(record(
    'channel_permissions',
    'channel-only-manager',
    {
      channel: channelOnly.channel.id,
      targetType: 'member',
      targetId: channelOnly.membership.id,
      allow: ['manage_channels'],
      deny: [],
    },
  ))
  assert.throws(
    () => routes.get('POST /api/thiscord/channels/{id}/move')(event({
      app: channelOnly.app,
      auth,
      body: { direction: 1 },
      path: { id: channelOnly.channel.id },
    })),
    /manage_channels/i,
  )
})

test('low-hierarchy managers cannot create roles at their own position', () => {
  const auth = record('users', 'low-role-manager')
  const fixture = communityFixture({
    userId: auth.id,
    permissions: [],
  })
  const managerRole = record('roles', 'low-manager-role', {
    community: fixture.community.id,
    managed: false,
    position: 1,
    permissions: ['manage_roles'],
  })
  fixture.app.collection('roles').push(managerRole)
  fixture.app.collection('member_roles').push(record('member_roles', 'low-manager-assignment', {
    membership: fixture.membership.id,
    role: managerRole.id,
  }))
  assert.throws(
    () => routes.get('POST /api/thiscord/communities/{id}/roles')(event({
      app: fixture.app,
      auth,
      body: { name: 'Unmanageable role', permissions: [] },
      path: { id: fixture.community.id },
    })),
    /above position 1/i,
  )
})

test('channel overwrite writes emit a community access revision signal', () => {
  const auth = record('users', 'revision-owner')
  const fixture = communityFixture({
    userId: auth.id,
    ownerId: auth.id,
    permissions: [],
  })
  routes.get('PUT /api/thiscord/channels/{id}/permissions')(event({
    app: fixture.app,
    auth,
    body: {
      targetType: 'role',
      targetId: fixture.everyone.id,
      allow: [],
      deny: ['view_channels'],
    },
    path: { id: fixture.channel.id },
  }))
  assert.equal(fixture.community.getInt('accessRevision'), 1)
})

test('role permission edits preserve permissions the manager cannot grant', () => {
  const auth = record('users', 'limited-role-manager')
  const fixture = communityFixture({
    userId: auth.id,
    permissions: [],
  })
  const managerRole = record('roles', 'limited-manager-role', {
    community: fixture.community.id,
    managed: false,
    position: 2,
    permissions: ['manage_roles', 'view_channels'],
  })
  const targetRole = record('roles', 'limited-target-role', {
    community: fixture.community.id,
    managed: false,
    position: 1,
    permissions: ['view_channels', 'send_messages'],
  })
  fixture.app.collection('roles').push(managerRole, targetRole)
  fixture.app.collection('member_roles').push(record('member_roles', 'limited-manager-assignment', {
    membership: fixture.membership.id,
    role: managerRole.id,
  }))

  routes.get('PATCH /api/thiscord/roles/{id}')(event({
    app: fixture.app,
    auth,
    body: {
      permissions: [],
      editedPermissions: ['view_channels'],
    },
    path: { id: targetRole.id },
  }))

  assert.deepEqual(targetRole.get('permissions'), ['send_messages'])
})

test('filtered channel overwrite edits preserve permissions omitted by the client', () => {
  const auth = record('users', 'limited-overwrite-manager')
  const fixture = communityFixture({
    userId: auth.id,
    permissions: [],
  })
  const managerRole = record('roles', 'overwrite-manager-role', {
    community: fixture.community.id,
    managed: false,
    position: 2,
    permissions: ['manage_roles', 'view_channels'],
  })
  const targetRole = record('roles', 'overwrite-target-role', {
    community: fixture.community.id,
    managed: false,
    position: 1,
    permissions: [],
  })
  const overwrite = record('channel_permissions', 'filtered-overwrite', {
    channel: fixture.channel.id,
    targetType: 'role',
    targetId: targetRole.id,
    allow: ['view_channels', 'send_messages'],
    deny: [],
  })
  fixture.app.collection('roles').push(managerRole, targetRole)
  fixture.app.collection('member_roles').push(record('member_roles', 'overwrite-manager-assignment', {
    membership: fixture.membership.id,
    role: managerRole.id,
  }))
  fixture.app.collection('channel_permissions').push(overwrite)

  routes.get('PUT /api/thiscord/channels/{id}/permissions')(event({
    app: fixture.app,
    auth,
    body: {
      targetType: 'role',
      targetId: targetRole.id,
      allow: [],
      deny: ['view_channels'],
      editedPermissions: ['view_channels'],
    },
    path: { id: fixture.channel.id },
  }))

  assert.deepEqual(overwrite.get('allow'), ['send_messages'])
  assert.deepEqual(overwrite.get('deny'), ['view_channels'])
})

test('channel deletion emits a community revision for remote cache invalidation', () => {
  const auth = record('users', 'channel-delete-owner')
  const fixture = communityFixture({
    userId: auth.id,
    ownerId: auth.id,
    permissions: [],
  })

  routes.get('DELETE /api/thiscord/channels/{id}')(event({
    app: fixture.app,
    auth,
    path: { id: fixture.channel.id },
  }))

  assert.equal(fixture.community.getInt('accessRevision'), 1)
  assert.equal(fixture.app.collection('channels').length, 0)
})

test('call heartbeats refresh live moderation capabilities', () => {
  const auth = record('users', 'capability-user')
  const fixture = communityFixture({
    userId: auth.id,
    permissions: ['view_channels', 'connect_voice', 'mute_members', 'manage_members'],
    channelKind: 'voice',
  })
  const handler = routes.get('POST /api/thiscord/calls/{kind}/{id}/presence')
  const joined = handler(event({
    app: fixture.app,
    auth,
    body: { state: 'joined', leaseId: 'capability-device', sequence: 1 },
    path: { kind: 'channel', id: fixture.channel.id },
  }))
  assert.equal(joined.value.canMuteMembers, true)
  assert.equal(joined.value.canRemoveMembers, true)
  fixture.everyone.set('permissions', ['view_channels', 'connect_voice'])
  const updated = handler(event({
    app: fixture.app,
    auth,
    body: { state: 'update', leaseId: 'capability-device', sequence: 2 },
    path: { kind: 'channel', id: fixture.channel.id },
  }))
  assert.equal(updated.value.canMuteMembers, false)
  assert.equal(updated.value.canRemoveMembers, false)
})

test('notification count is authoritative beyond the first rendered page', () => {
  const auth = record('users', 'notification-count-user')
  const notifications = Array.from({ length: 35 }, (_, index) => record(
    'notifications',
    `unread-${index}`,
    { user: auth.id, readAt: '' },
  ))
  notifications.push(record('notifications', 'already-read', {
    user: auth.id,
    readAt: '2026-01-01',
  }))
  const response = routes.get('GET /api/thiscord/notifications/unread-count')(event({
    app: new MemoryApp({ users: [auth], notifications }),
    auth,
  }))
  assert.equal(response.value.count, 35)
})

test('muted channel notifications decode PocketBase JSONRaw preferences', () => {
  const lifecycle = loadLifecycleHandlers()
  const author = record('users', 'muted-author', { handle: 'author' })
  const target = record('users', 'muted-target', {
    handle: 'target',
    preferences: {
      string: () => JSON.stringify({ mutedChannels: ['muted-channel'] }),
    },
  })
  const community = record('communities', 'muted-community', { owner: author.id })
  const channel = record('channels', 'muted-channel', {
    community: community.id,
    kind: 'text',
  })
  const everyone = record('roles', 'muted-everyone', {
    community: community.id,
    managed: true,
    position: 0,
    permissions: ['view_channels', 'read_history'],
  })
  const app = new MemoryApp({
    users: [author, target],
    communities: [community],
    channels: [channel],
    roles: [everyone],
    memberships: [
      record('memberships', 'muted-author-member', {
        community: community.id,
        user: author.id,
        state: 'active',
      }),
      record('memberships', 'muted-target-member', {
        community: community.id,
        user: target.id,
        state: 'active',
      }),
    ],
    member_roles: [],
    channel_permissions: [],
    notifications: [],
  })

  lifecycle.afterCreate('messages', app, record('messages', 'muted-mention', {
    channel: channel.id,
    author: author.id,
    content: 'Hello @target',
    deletedAt: '',
  }))

  assert.equal(app.collection('notifications').length, 0)
})

test('mention fan-out requires delimited nonempty mention tokens', () => {
  const lifecycle = loadLifecycleHandlers()
  const author = record('users', 'mention-author', { handle: 'author' })
  const target = record('users', 'mention-target', { handle: 'target' })
  const roleTarget = record('users', 'role-target', { handle: 'role-target' })
  const community = record('communities', 'mention-community', { owner: author.id })
  const channel = record('channels', 'mention-channel', {
    community: community.id,
    kind: 'text',
  })
  const everyone = record('roles', 'mention-everyone', {
    community: community.id,
    managed: true,
    position: 0,
    permissions: ['view_channels', 'read_history'],
  })
  const ops = record('roles', 'mention-ops', {
    community: community.id,
    name: 'Ops',
    mentionable: true,
    managed: false,
    position: 1,
    permissions: [],
  })
  const symbols = record('roles', 'mention-symbols', {
    community: community.id,
    name: '!!!',
    mentionable: true,
    managed: false,
    position: 2,
    permissions: [],
  })
  const memberships = [
    record('memberships', 'mention-author-member', { community: community.id, user: author.id, state: 'active' }),
    record('memberships', 'mention-target-member', { community: community.id, user: target.id, state: 'active' }),
    record('memberships', 'mention-role-member', { community: community.id, user: roleTarget.id, state: 'active' }),
  ]
  const app = new MemoryApp({
    users: [author, target, roleTarget],
    communities: [community],
    channels: [channel],
    roles: [everyone, ops, symbols],
    memberships,
    member_roles: [
      record('member_roles', 'mention-ops-assignment', { membership: memberships[2].id, role: ops.id }),
      record('member_roles', 'mention-symbol-assignment', { membership: memberships[1].id, role: symbols.id }),
    ],
    channel_permissions: [],
    notifications: [],
  })
  lifecycle.afterCreate('messages', app, record('messages', 'mention-false-positive', {
    channel: channel.id,
    author: author.id,
    content: 'mail@target.com @ops-team @',
    deletedAt: '',
  }))
  assert.equal(app.collection('notifications').length, 0)
  lifecycle.afterCreate('messages', app, record('messages', 'mention-delimited', {
    channel: channel.id,
    author: author.id,
    content: 'Hello (@target), please ask @ops!',
    deletedAt: '',
  }))
  assert.deepEqual(
    app.collection('notifications').map((item) => item.getString('user')).sort(),
    [roleTarget.id, target.id].sort(),
  )
})
