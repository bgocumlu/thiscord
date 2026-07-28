import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import test from 'node:test'
import { resolve } from 'node:path'

import {
  communityFixture,
  loadAccessRequestHooks,
  loadCallAccess,
  loadChannelAccess,
  loadPermissions,
  MemoryApp,
  record,
} from './support/pocketbase-harness.mjs'

test('canonical policy manifest and PocketBase artifact cannot drift', async () => {
  const manifest = JSON.parse(await readFile(
    resolve(import.meta.dirname, '../../shared/policies/manifest.json'),
    'utf8',
  ))
  const server = loadPermissions()
  assert.deepEqual(server.POLICY_MANIFEST, manifest)
  assert.deepEqual(server.ALL_PERMISSIONS, manifest.permissions.map((permission) => permission.id))
  assert.deepEqual(server.DEFAULT_MEMBER_PERMISSIONS, manifest.defaultMemberPermissions)
})

test('raw scoped collection lists are denied instead of filtering after pagination', () => {
  const { listHandlers } = loadAccessRequestHooks()
  const channelLists = listHandlers.find(({ collections }) => collections.includes('channels'))
  const callLists = listHandlers.find(({ collections }) => collections.includes('call_rooms'))
  for (const registration of [channelLists, callLists]) {
    assert.ok(registration)
    assert.throws(
      () => registration.handler({
        hasSuperuserAuth: () => false,
        next: assert.fail,
      }),
      /authorized thiscord/i,
    )
    let continued = false
    registration.handler({
      hasSuperuserAuth: () => true,
      next: () => {
        continued = true
      },
    })
    assert.equal(continued, true)
  }
})

test('realtime channel and call authorization use auth attached during subscription', () => {
  const { realtimeHandlers } = loadAccessRequestHooks()
  assert.equal(realtimeHandlers.length, 1)
  const fixture = communityFixture({ permissions: ['view_channels', 'read_history'] })
  const auth = record('users', fixture.membership.getString('user'))
  const message = {
    name: 'messages/*',
    data: JSON.stringify({
      action: 'create',
      record: { id: 'message', channel: fixture.channel.id },
    }),
  }
  let delivered = false
  realtimeHandlers[0]({
    app: fixture.app,
    auth: undefined,
    client: { get: (key) => key === 'auth' ? auth : undefined },
    hasSuperuserAuth: () => false,
    message,
    next: () => { delivered = true },
  })
  assert.equal(delivered, true)

  let leaked = false
  realtimeHandlers[0]({
    app: fixture.app,
    auth: undefined,
    client: { get: () => record('users', 'outsider') },
    hasSuperuserAuth: () => false,
    message,
    next: () => { leaked = true },
  })
  assert.equal(leaked, false)

  const voice = communityFixture({
    permissions: ['view_channels', 'connect_voice'],
    channelKind: 'voice',
  })
  let callDelivered = false
  realtimeHandlers[0]({
    app: voice.app,
    auth: undefined,
    client: {
      get: () => record('users', voice.membership.getString('user')),
    },
    hasSuperuserAuth: () => false,
    message: {
      name: 'call_rooms/*',
      data: JSON.stringify({
        action: 'update',
        record: {
          id: voice.callRoom.id,
          channel: voice.channel.id,
          conversation: '',
        },
      }),
    },
    next: () => { callDelivered = true },
  })
  assert.equal(callDelivered, true)
})

test('batched record helpers do not impose an installation-sized count cap', () => {
  const permissions = loadPermissions()
  assert.equal(
    permissions.databaseDate(new Date('2026-07-27T12:34:56.789Z')),
    '2026-07-27 12:34:56.789Z',
  )
  const memberships = Array.from({ length: 751 }, (_, index) => (
    record('memberships', `member-${index}`, { community: 'large', state: 'active' })
  ))
  const app = new MemoryApp({ memberships })
  assert.equal(
    permissions.countRecordsByFilter(
      app,
      'memberships',
      "community = {:community} && state = 'active'",
      { community: 'large' },
    ),
    memberships.length,
  )
  assert.equal(
    permissions.findAllRecordsByFilter(
      app,
      'memberships',
      "community = {:community} && state = 'active'",
      '',
      { community: 'large' },
    ).length,
    memberships.length,
  )
})

test('authorized pagination fills pages after hidden records instead of filtering a raw page', () => {
  const permissions = loadPermissions()
  const messages = Array.from({ length: 230 }, (_, index) => record('messages', `message-${index}`, {
    created: String(index).padStart(3, '0'),
    visible: index >= 210,
  }))
  const app = new MemoryApp({ messages })
  const page = permissions.findAuthorizedPage(
    app,
    'messages',
    '',
    '+created',
    {},
    1,
    10,
    (message) => message.getBool('visible'),
  )

  assert.equal(page.items.length, 10)
  assert.equal(page.items[0].id, 'message-210')
  assert.equal(page.hasMore, true)
})

test('the V2 migrations contain the baseline and data-preserving presence upgrade', async () => {
  const migrationsDirectory = resolve(import.meta.dirname, '../pb_migrations')
  const migrationFiles = (await readdir(migrationsDirectory)).filter((name) => name.endsWith('.js'))
  assert.deepEqual(migrationFiles, [
    '1785031200_v2_baseline.js',
    '1785254000_presence_schema_upgrade.js',
    '1785256000_user_directory_access.js',
    '1785260000_call_server_mute.js',
  ])
  const migration = await readFile(
    resolve(migrationsDirectory, '1785031200_v2_baseline.js'),
    'utf8',
  )
  const presenceUpgrade = await readFile(
    resolve(migrationsDirectory, '1785254000_presence_schema_upgrade.js'),
    'utf8',
  )
  const directoryAccess = await readFile(
    resolve(migrationsDirectory, '1785256000_user_directory_access.js'),
    'utf8',
  )
  const callServerMute = await readFile(
    resolve(migrationsDirectory, '1785260000_call_server_mute.js'),
    'utf8',
  )
  assert.match(migration, /CREATE UNIQUE INDEX idx_call_rooms_room_name ON call_rooms \(roomName\)/)
  assert.match(migration, /validate_call_rooms_target_insert/)
  assert.match(migration, /validate_call_rooms_target_update/)
  assert.match(migration, /validate_conversation_member_limit/)
  assert.match(migration, /validate_conversation_owner_update/)
  assert.match(migration, /validate_conversation_owner_member_delete/)
  assert.match(migration, /const conversationMemberLimit = 25;/)
  assert.match(migration, /name: "call_token_versions"/)
  assert.match(migration, /idx_call_token_versions_room_user/)
  assert.match(migration, /name: "call_ejections"/)
  assert.match(migration, /CREATE UNIQUE INDEX idx_call_ejections_target ON call_ejections \(roomName, userId\)/)
  assert.match(migration, /name: "expiresAt"/)
  assert.match(migration, /name: "direct_reactions"/)
  assert.match(migration, /name: "direct_typing"/)
  assert.match(migration, /name: "preferences",\s+maxSize: 32 \* 1024,\s+hidden: true/)
  assert.match(migration, /@request\.body\.preferences:isset = false/)
  assert.match(migration, /@request\.body\.status:isset = false/)
  assert.match(migration, /name: "presence_leases"/)
  assert.match(migration, /name: "community_presence"/)
  assert.match(migration, /name: "call_presence_leases"/)
  assert.match(migration, /CREATE UNIQUE INDEX idx_presence_user ON presence \(user\)/)
  assert.match(migration, /name: "devices", maxSize: 16 \* 1024, hidden: true/)
  assert.match(migration, /users\.indexes\.filter\(\(index\) => !index\.includes\("idx_users_handle"\)\)/)
  assert.match(migration, /app\.importCollections\(\[definition\], false\)/)
  assert.doesNotMatch(migration, /idx_presence_user_device|name: "deviceId"/)
  assert.match(presenceUpgrade, /presence\.fields\.removeByName\("deviceId"\)/)
  assert.match(presenceUpgrade, /presence\.fields\.removeByName\("expiresAt"\)/)
  assert.match(presenceUpgrade, /clearRecords\("presence"\)/)
  assert.match(presenceUpgrade, /name: "community_presence"/)
  assert.match(presenceUpgrade, /name: "presence_leases"/)
  assert.match(presenceUpgrade, /name: "call_presence_leases"/)
  assert.match(directoryAccess, /memberships_via_user\.community\.memberships_via_community\.user/)
  assert.match(directoryAccess, /conversation_members_via_user\.conversation\.conversation_members_via_conversation\.user/)
  assert.match(directoryAccess, /users\.fields\.getByName\(name\)\.hidden = true/)
  assert.match(callServerMute, /name: "serverMuted"/)
  assert.match(callServerMute, /fields\.removeByName\("serverMuted"\)/)
  assert.match(migration, /ownMembership/)
  assert.match(migration, /user = @request\.auth\.id \|\| \(@collection\.conversation_members:viewer/)
  assert.match(migration, /name: "lastMessageAt", required: true/)
  assert.match(
    migration,
    /name: "invites",\s+listRule: null,\s+viewRule: null,/,
  )
  assert.doesNotMatch(migration, /voiceChannel|channelId|v1 call/i)
})

test('call rooms require exactly one target and use target-specific access', () => {
  const calls = loadCallAccess()
  const fixture = communityFixture({
    permissions: ['view_channels', 'connect_voice', 'speak', 'stream_video'],
    channelKind: 'voice',
  })
  assert.deepEqual(calls.validateRoomTarget(fixture.callRoom), {
    kind: 'channel',
    id: fixture.channel.id,
  })
  assert.throws(
    () => calls.validateRoomTarget(record('call_rooms', 'empty')),
    /exactly one target/i,
  )
  assert.throws(
    () => calls.validateRoomTarget(record('call_rooms', 'ambiguous', {
      channel: fixture.channel.id,
      conversation: 'conversation',
    })),
    /exactly one target/i,
  )

  const conversation = record('conversations', 'conversation', { owner: 'member' })
  const conversationRoom = record('call_rooms', 'conversation-room', {
    channel: '',
    conversation: conversation.id,
  })
  fixture.app.collection('conversations').push(conversation)
  fixture.app.collection('conversation_members').push(record('conversation_members', 'conversation-member', {
    conversation: conversation.id,
    user: 'member',
  }))
  assert.equal(calls.canViewRecord(fixture.app, conversationRoom, 'member'), true)
  assert.equal(calls.canViewRecord(fixture.app, conversationRoom, 'outsider'), false)
  assert.equal(calls.canViewRecord(fixture.app, fixture.callRoom, 'member'), true)
  assert.equal(calls.canViewRecord(fixture.app, fixture.callRoom, 'outsider'), false)
})

test('permission changes eject only participants who actually lose voice access', () => {
  const calls = loadCallAccess()
  const fixture = communityFixture({
    permissions: ['view_channels', 'connect_voice'],
    channelKind: 'voice',
  })
  const call = record('call_sessions', 'active-call', {
    room: fixture.callRoom.id,
    endedAt: '',
  })
  const participant = record('call_participants', 'active-participant', {
    call: call.id,
    user: fixture.membership.getString('user'),
    leftAt: '',
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  })
  fixture.app.collection('call_sessions').push(call)
  fixture.app.collection('call_participants').push(participant)

  fixture.everyone.set('permissions', [
    'view_channels',
    'connect_voice',
    'speak',
    'stream_video',
    'send_messages',
  ])
  assert.equal(
    calls.revokeUnauthorizedTargetParticipants(
      fixture.app,
      { kind: 'channel', id: fixture.channel.id },
      '',
      false,
    ),
    0,
  )
  assert.equal(participant.getString('leftAt'), '')

  fixture.everyone.set('permissions', ['view_channels', 'send_messages'])
  assert.equal(
    calls.revokeUnauthorizedTargetParticipants(
      fixture.app,
      { kind: 'channel', id: fixture.channel.id },
      '',
      false,
    ),
    1,
  )
  assert.ok(participant.getString('leftAt'))
  assert.ok(call.getString('endedAt'))
})

test('category permission changes re-evaluate active child voice participants', () => {
  const calls = loadCallAccess()
  const fixture = communityFixture({
    permissions: ['view_channels', 'connect_voice', 'speak', 'stream_video'],
    channelKind: 'voice',
  })
  const category = record('channels', 'category', {
    community: fixture.community.id,
    kind: 'category',
    parent: '',
  })
  fixture.app.collection('channels').push(category)
  fixture.channel.set('parent', category.id)
  const call = record('call_sessions', 'category-call', {
    room: fixture.callRoom.id,
    endedAt: '',
  })
  const participant = record('call_participants', 'category-participant', {
    call: call.id,
    user: fixture.membership.getString('user'),
    leftAt: '',
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  })
  fixture.app.collection('call_sessions').push(call)
  fixture.app.collection('call_participants').push(participant)

  assert.equal(calls.revokeUnauthorizedChannelParticipants(
    fixture.app,
    category.id,
    '',
    false,
  ), 0)
  fixture.app.collection('channel_permissions').push(record('channel_permissions', 'category-deny', {
    channel: category.id,
    targetType: 'role',
    targetId: fixture.everyone.id,
    allow: [],
    deny: ['connect_voice'],
  }))
  assert.equal(calls.revokeUnauthorizedChannelParticipants(
    fixture.app,
    category.id,
    '',
    false,
  ), 1)
  assert.ok(participant.getString('leftAt'))
})

test('failed media ejections do not block authorization changes when the retry is durable', () => {
  const calls = loadCallAccess()
  const fixture = communityFixture({
    permissions: ['view_channels', 'connect_voice'],
    channelKind: 'voice',
  })
  const call = record('call_sessions', 'queued-call', {
    room: fixture.callRoom.id,
    endedAt: '',
  })
  const participant = record('call_participants', 'queued-participant', {
    call: call.id,
    user: fixture.membership.getString('user'),
    leftAt: '',
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  })
  fixture.app.collection('call_sessions').push(call)
  fixture.app.collection('call_participants').push(participant)
  globalThis.$os = {
    getenv: (name) => ({
      JITSI_APP_SECRET: 'control-secret',
      JITSI_CONTROL_URL: 'http://prosody.test/thiscord-call-control',
    })[name] || '',
  }
  globalThis.$http = { send: () => { throw new Error('media unavailable') } }

  assert.equal(calls.revokeTargetParticipant(
    fixture.app,
    { kind: 'channel', id: fixture.channel.id },
    fixture.membership.getString('user'),
  ), true)
  assert.ok(participant.getString('leftAt'))
  assert.equal(fixture.app.collection('call_ejections').length, 1)

  fixture.everyone.set('permissions', ['view_channels'])
  let retries = 0
  globalThis.$http.send = () => {
    retries += 1
    return { statusCode: 200, raw: '{"kicked":1}' }
  }
  assert.equal(calls.retryPendingEjections(
    fixture.app,
    new Date(Date.now() + 20 * 60_000).toISOString(),
  ), 1)
  assert.equal(retries, 1)
  assert.equal(fixture.app.collection('call_ejections').length, 0)
})

test('call-control retries use ordered bounded batches and a wall-time budget', () => {
  const calls = loadCallAccess()
  const base = Date.now() - 60_000
  const pending = Array.from({ length: 8 }, (_, index) => record(
    'call_ejections',
    `pending-${index}`,
    {
      roomName: `room-${index}`,
      userId: `user-${index}`,
      action: 'kick',
      revision: 1,
      nextAttemptAt: new Date(base + index).toISOString(),
    },
  ))
  const app = new MemoryApp({ call_ejections: pending })
  globalThis.$os = {
    getenv: (name) => ({
      JITSI_APP_SECRET: 'control-secret',
      JITSI_CONTROL_URL: 'http://prosody.test/thiscord-call-control',
    })[name] || '',
  }
  let elapsed = 0
  const requests = []
  globalThis.$http = {
    send: (request) => {
      requests.push({
        timeout: request.timeout,
        userId: JSON.parse(request.body).userIds[0],
      })
      elapsed += 3_000
      return { statusCode: 200, raw: '{"kicked":1}' }
    },
  }

  assert.equal(calls.retryPendingEjections(
    app,
    new Date().toISOString(),
    {
      limit: 6,
      maxDurationMs: 5_000,
      clock: () => elapsed,
    },
  ), 2)
  assert.deepEqual(requests, [
    { timeout: 5, userId: 'user-0' },
    { timeout: 2, userId: 'user-1' },
  ])
  assert.deepEqual(
    app.collection('call_ejections').map((item) => item.id),
    Array.from({ length: 6 }, (_, index) => `pending-${index + 2}`),
  )
})

test('request-time call control dispatch uses exact intent revisions', () => {
  const calls = loadCallAccess()
  const now = Date.now()
  const old = record('call_ejections', 'old-due', {
    roomName: 'old-room',
    userId: 'old-user',
    action: 'kick',
    revision: 1,
    nextAttemptAt: new Date(now - 60_000).toISOString(),
  })
  const recent = record('call_ejections', 'new-due', {
    roomName: 'new-room',
    userId: 'new-user',
    action: 'kick',
    revision: 1,
    nextAttemptAt: new Date(now - 1_000).toISOString(),
  })
  const app = new MemoryApp({ call_ejections: [old, recent] })
  globalThis.$os = {
    getenv: (name) => ({
      JITSI_APP_SECRET: 'control-secret',
      JITSI_CONTROL_URL: 'http://prosody.test/thiscord-call-control',
    })[name] || '',
  }
  const requests = []
  globalThis.$http = {
    send: (request) => {
      requests.push(JSON.parse(request.body).userIds[0])
      return { statusCode: 200, raw: '{"kicked":1}' }
    },
  }

  assert.equal(
    calls.dispatchPendingCallControls(app, [{ id: recent.id, revision: 1 }]),
    1,
  )
  assert.deepEqual(requests, ['new-user'])
  assert.deepEqual(app.collection('call_ejections').map((item) => item.id), ['old-due'])
})

test('request-time call control batches every healthy bulk revocation', () => {
  const calls = loadCallAccess()
  const pending = Array.from({ length: 30 }, (_, index) => record(
    'call_ejections',
    `bulk-${index}`,
    {
      roomName: 'shared-room',
      userId: `bulk-user-${index}`,
      action: 'kick',
      revision: 1,
      nextAttemptAt: new Date(Date.now() - 1_000).toISOString(),
    },
  ))
  const app = new MemoryApp({ call_ejections: pending })
  globalThis.$os = {
    getenv: (name) => ({
      JITSI_APP_SECRET: 'control-secret',
      JITSI_CONTROL_URL: 'http://prosody.test/thiscord-call-control',
    })[name] || '',
  }
  const batches = []
  globalThis.$http = {
    send: (request) => {
      batches.push(JSON.parse(request.body).userIds)
      return { statusCode: 200, raw: '{"kicked":30}' }
    },
  }

  assert.equal(
    calls.dispatchPendingCallControls(
      app,
      pending.map((item) => ({ id: item.id, revision: 1 })),
    ),
    30,
  )
  assert.equal(app.collection('call_ejections').length, 0)
  assert.equal(batches.length, 1)
  assert.equal(batches[0].length, 30)
})

test('cron pages and batches a large due call-control backlog', () => {
  const calls = loadCallAccess()
  const pending = Array.from({ length: 1_000 }, (_, index) => record(
    'call_ejections',
    `backlog-${String(index).padStart(4, '0')}`,
    {
      roomName: 'backlog-room',
      userId: `backlog-user-${index}`,
      action: 'kick',
      revision: 1,
      tokenVersion: 1,
      tokenExpiresAt: new Date(Date.now() + 300_000 + index).toISOString(),
      nextAttemptAt: new Date(Date.now() - 1_000).toISOString(),
    },
  ))
  const app = new MemoryApp({ call_ejections: pending })
  globalThis.$os = {
    getenv: (name) => ({
      JITSI_APP_SECRET: 'control-secret',
      JITSI_CONTROL_URL: 'http://prosody.test/thiscord-call-control',
    })[name] || '',
  }
  const batches = []
  globalThis.$http = {
    send: (request) => {
      batches.push(JSON.parse(request.body))
      return { statusCode: 200, raw: '{"kicked":1000}' }
    },
  }

  assert.equal(calls.retryPendingEjections(app), 1_000)
  assert.equal(app.collection('call_ejections').length, 0)
  assert.equal(batches.length, 2)
  assert.equal(batches[0].action, 'revoke')
  assert.equal(batches[0].tokenVersion, 1)
  assert.equal(batches[0].userIds.length, 1_000)
  assert.equal(batches[1].action, 'kick')
  assert.equal(batches[1].userIds.length, 1_000)
})

test('a fully restored queued kick clears stale media restrictions', () => {
  const calls = loadCallAccess()
  const fixture = communityFixture({
    permissions: [
      'view_channels',
      'connect_voice',
      'speak',
      'stream_video',
    ],
    channelKind: 'voice',
  })
  const pending = record('call_ejections', 'restored-kick', {
    roomName: fixture.callRoom.getString('roomName'),
    userId: fixture.membership.getString('user'),
    action: 'kick',
    revision: 1,
    canSpeak: false,
    canStreamVideo: false,
    nextAttemptAt: new Date(Date.now() - 1_000).toISOString(),
  })
  fixture.app.collection('call_ejections').push(pending)
  globalThis.$os = {
    getenv: (name) => ({
      JITSI_APP_SECRET: 'control-secret',
      JITSI_CONTROL_URL: 'http://prosody.test/thiscord-call-control',
    })[name] || '',
  }
  const controls = []
  globalThis.$http = {
    send: (request) => {
      controls.push(JSON.parse(request.body))
      return { statusCode: 200, raw: '{"updated":1}' }
    },
  }

  assert.equal(calls.retryPendingEjections(fixture.app), 1)
  assert.equal(controls.length, 1)
  assert.equal(controls[0].action, 'policy')
  assert.equal(controls[0].canSpeak, true)
  assert.equal(controls[0].canStreamVideo, true)
})

test('failed token revocation blocks its dependent kick until retry', () => {
  const calls = loadCallAccess()
  const pending = record('call_ejections', 'revoke-before-kick', {
    roomName: 'revoke-first-room',
    userId: 'revoke-first-user',
    action: 'kick',
    revision: 1,
    tokenVersion: 3,
    tokenExpiresAt: new Date(Date.now() + 300_000).toISOString(),
    nextAttemptAt: new Date(Date.now() - 1_000).toISOString(),
  })
  const app = new MemoryApp({ call_ejections: [pending] })
  globalThis.$os = {
    getenv: (name) => ({
      JITSI_APP_SECRET: 'control-secret',
      JITSI_CONTROL_URL: 'http://prosody.test/thiscord-call-control',
    })[name] || '',
  }
  const actions = []
  globalThis.$http = {
    send: (request) => {
      const action = JSON.parse(request.body).action
      actions.push(action)
      if (action === 'revoke') throw new Error('token control unavailable')
      return { statusCode: 200, raw: '{"kicked":1}' }
    },
  }

  assert.equal(calls.retryPendingEjections(app), 0)
  assert.deepEqual(actions, ['revoke'])
  assert.equal(app.collection('call_ejections').length, 1)
  assert.equal(pending.getInt('revision'), 2)
  assert.equal(pending.getInt('attempts'), 1)
})

test('call-control workers cannot delete or resave a newer coalesced revision', () => {
  const calls = loadCallAccess()
  globalThis.$os = {
    getenv: (name) => ({
      JITSI_APP_SECRET: 'control-secret',
      JITSI_CONTROL_URL: 'http://prosody.test/thiscord-call-control',
    })[name] || '',
  }
  for (const succeeds of [true, false]) {
    const pending = record('call_ejections', `raced-${succeeds}`, {
      roomName: `raced-room-${succeeds}`,
      userId: `raced-user-${succeeds}`,
      action: 'kick',
      revision: 1,
      attempts: 7,
      nextAttemptAt: new Date(Date.now() - 1_000).toISOString(),
    })
    const app = new MemoryApp({ call_ejections: [pending] })
    globalThis.$http = {
      send: () => {
        pending.set('revision', 2)
        pending.set('attempts', 0)
        pending.set('tokenVersion', 9)
        if (!succeeds) throw new Error('old dispatch failed')
        return { statusCode: 200, raw: '{"kicked":1}' }
      },
    }
    assert.equal(calls.retryPendingEjections(app), 0)
    assert.equal(app.collection('call_ejections').length, 1)
    assert.equal(pending.getInt('revision'), 2)
    assert.equal(pending.getInt('attempts'), 0)
    assert.equal(pending.getInt('tokenVersion'), 9)
  }
})

test('call-control finalization conditionally mutates the exact revision', () => {
  const calls = loadCallAccess()
  globalThis.$os = {
    getenv: (name) => ({
      JITSI_APP_SECRET: 'control-secret',
      JITSI_CONTROL_URL: 'http://prosody.test/thiscord-call-control',
    })[name] || '',
  }
  for (const succeeds of [true, false]) {
    const pending = record('call_ejections', `finalize-race-${succeeds}`, {
      roomName: `finalize-room-${succeeds}`,
      userId: `finalize-user-${succeeds}`,
      action: 'kick',
      revision: 1,
      attempts: 7,
      nextAttemptAt: new Date(Date.now() - 1_000).toISOString(),
    })
    const app = new MemoryApp({ call_ejections: [pending] })
    app.db = () => ({
      newQuery: (sql) => {
        let params
        const query = {
          bind: (value) => {
            params = value
            return query
          },
          execute: () => {
            assert.match(sql, /id = \{:id\} AND revision = \{:revision\}/)
            // A producer commits a fresh intent at the last possible moment,
            // after the worker has prepared and dispatched its older revision.
            pending.set('revision', 2)
            pending.set('attempts', 0)
            pending.set('tokenVersion', 9)
            const matches = pending.id === params.id
              && pending.getInt('revision') === Number(params.revision)
            return { rowsAffected: () => Number(matches) }
          },
        }
        return query
      },
    })
    globalThis.$http = {
      send: () => {
        if (!succeeds) throw new Error('old dispatch failed')
        return { statusCode: 200, raw: '{"kicked":1}' }
      },
    }

    assert.equal(calls.retryPendingEjections(app), 0)
    assert.equal(app.collection('call_ejections').length, 1)
    assert.equal(pending.getInt('revision'), 2)
    assert.equal(pending.getInt('attempts'), 0)
    assert.equal(pending.getInt('tokenVersion'), 9)
  }
})

test('fresh call-control intents reset inherited retry state', () => {
  const calls = loadCallAccess()
  const room = record('call_rooms', 'retry-room-record', {
    roomName: 'retry-room',
    channel: 'voice-channel',
    conversation: '',
  })
  const pending = record('call_ejections', 'retry-row', {
    roomName: 'retry-room',
    userId: 'retry-user',
    action: 'kick',
    revision: 4,
    attempts: 9,
    lastError: 'old outage',
    nextAttemptAt: new Date(Date.now() + 15 * 60_000).toISOString(),
  })
  const app = new MemoryApp({
    call_ejections: [pending],
    call_rooms: [room],
  })
  const intents = []

  calls.queueCallControl(app, room, 'retry-user', 'kick', null, null, intents)

  assert.equal(pending.getInt('revision'), 5)
  assert.equal(pending.getInt('attempts'), 0)
  assert.equal(pending.getString('lastError'), '')
  assert.ok(new Date(pending.getString('nextAttemptAt')).getTime() < Date.now() + 1_000)
  assert.deepEqual(intents, [{ id: pending.id, revision: 5 }])
})

test('authorization changes fail closed when media control and its outbox both fail', () => {
  const calls = loadCallAccess()
  const fixture = communityFixture({
    permissions: ['view_channels', 'connect_voice'],
    channelKind: 'voice',
  })
  const call = record('call_sessions', 'outbox-failure-call', {
    room: fixture.callRoom.id,
    endedAt: '',
  })
  const participant = record('call_participants', 'outbox-failure-participant', {
    call: call.id,
    user: fixture.membership.getString('user'),
    leftAt: '',
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  })
  fixture.app.collection('call_sessions').push(call)
  fixture.app.collection('call_participants').push(participant)
  fixture.everyone.set('permissions', ['view_channels'])
  globalThis.$os = {
    getenv: (name) => ({
      JITSI_APP_SECRET: 'control-secret',
      JITSI_CONTROL_URL: 'http://prosody.test/thiscord-call-control',
    })[name] || '',
  }
  globalThis.$http = { send: () => { throw new Error('media unavailable') } }
  const save = fixture.app.save.bind(fixture.app)
  fixture.app.save = (candidate) => {
    if (candidate.collection().name === 'call_ejections') {
      throw new Error('outbox unavailable')
    }
    return save(candidate)
  }

  assert.throws(
    () => calls.revokeUnauthorizedTargetParticipants(
      fixture.app,
      { kind: 'channel', id: fixture.channel.id },
    ),
    /outbox unavailable/i,
  )
  assert.equal(fixture.app.collection('call_ejections').length, 0)
})

test('pending restrictive media policy dispatches only after the authorization write', () => {
  const calls = loadCallAccess()
  const fixture = communityFixture({
    permissions: ['view_channels', 'connect_voice'],
    channelKind: 'voice',
  })
  const call = record('call_sessions', 'policy-call', {
    room: fixture.callRoom.id,
    endedAt: '',
  })
  const participant = record('call_participants', 'policy-participant', {
    call: call.id,
    user: fixture.membership.getString('user'),
    leftAt: '',
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  })
  fixture.app.collection('call_sessions').push(call)
  fixture.app.collection('call_participants').push(participant)
  globalThis.$os = {
    getenv: (name) => ({
      JITSI_APP_SECRET: 'control-secret',
      JITSI_CONTROL_URL: 'http://prosody.test/thiscord-call-control',
    })[name] || '',
  }
  globalThis.$http = { send: () => { throw new Error('media unavailable') } }

  let requests = 0
  globalThis.$http.send = () => {
    requests += 1
    throw new Error('media unavailable')
  }
  assert.equal(calls.revokeUnauthorizedTargetParticipants(
    fixture.app,
    { kind: 'channel', id: fixture.channel.id },
  ), 0)
  assert.equal(requests, 0)
  assert.equal(participant.getString('leftAt'), '')
  assert.equal(fixture.app.collection('call_ejections').length, 1)

  const actions = []
  globalThis.$http.send = (request) => {
    actions.push(JSON.parse(request.body).action)
    return { statusCode: 200, raw: '{"kicked":1}' }
  }
  assert.equal(calls.retryPendingEjections(
    fixture.app,
    new Date(Date.now() + 20 * 60_000).toISOString(),
  ), 1)
  assert.deepEqual(actions, ['policy'])
  assert.equal(fixture.app.collection('call_ejections').length, 0)
})

test('permission revocation invalidates an issued call token before presence exists', () => {
  const calls = loadCallAccess()
  const fixture = communityFixture({
    permissions: ['view_channels', 'connect_voice'],
    channelKind: 'voice',
  })
  const expiresAt = new Date(Date.now() + 300_000).toISOString()
  const tokenState = record('call_token_versions', 'unused-token', {
    room: fixture.callRoom.id,
    user: fixture.membership.getString('user'),
    version: 3,
    expiresAt,
  })
  fixture.app.collection('call_token_versions').push(tokenState)
  const requests = []
  globalThis.$os = {
    getenv: (name) => ({
      JITSI_APP_SECRET: 'control-secret',
      JITSI_CONTROL_URL: 'http://prosody.test/thiscord-call-control',
    })[name] || '',
  }
  globalThis.$http.send = (request) => {
    requests.push(JSON.parse(request.body))
    return { statusCode: 200, raw: '{}' }
  }

  assert.equal(calls.revokeTargetParticipant(
    fixture.app,
    { kind: 'channel', id: fixture.channel.id },
    fixture.membership.getString('user'),
  ), true)
  assert.equal(fixture.app.collection('call_participants').length, 0)
  assert.equal(tokenState.getInt('revokedThrough'), 3)
  assert.equal(tokenState.getString('revokedExpiresAt'), expiresAt)
  assert.deepEqual(requests, [])
  assert.equal(fixture.app.collection('call_ejections').length, 1)
  assert.equal(calls.retryPendingEjections(
    fixture.app,
    new Date(Date.now() + 1_000).toISOString(),
  ), 1)
  assert.deepEqual(requests.map((request) => request.action), ['revoke', 'kick'])
  assert.equal(requests[0].tokenVersion, 3)
  assert.equal(requests[0].expiresAt, new Date(expiresAt).getTime())
})

test('community revocation skips empty voice rooms without tokens', () => {
  const calls = loadCallAccess()
  const fixture = communityFixture({
    permissions: ['view_channels', 'connect_voice'],
    channelKind: 'voice',
  })
  let requests = 0
  globalThis.$os = {
    getenv: (name) => ({
      JITSI_APP_SECRET: 'control-secret',
      JITSI_CONTROL_URL: 'http://prosody.test/thiscord-call-control',
    })[name] || '',
  }
  globalThis.$http = {
    send: () => {
      requests += 1
      return { statusCode: 200, raw: '{}' }
    },
  }

  assert.equal(calls.revokeCommunityParticipant(
    fixture.app,
    fixture.community.id,
    fixture.membership.getString('user'),
  ), 0)
  assert.equal(fixture.app.collection('call_ejections').length, 0)
  assert.equal(requests, 0)
})

test('permission resolution applies everyone, role union, then member overwrite', () => {
  const permissions = loadPermissions()
  const fixture = communityFixture({
    permissions: ['view_channels', 'read_history', 'send_messages'],
  })
  const role = record('roles', 'writer', {
    community: fixture.community.id,
    managed: false,
    position: 10,
    permissions: ['attach_files'],
  })
  fixture.app.collection('roles').push(role)
  fixture.app.collection('member_roles').push(record('member_roles', 'assignment', {
    membership: fixture.membership.id,
    role: role.id,
  }))
  fixture.app.collection('channel_permissions').push(
    record('channel_permissions', 'everyone-deny', {
      channel: fixture.channel.id,
      targetType: 'role',
      targetId: fixture.everyone.id,
      allow: [],
      deny: ['send_messages'],
      created: '2026-01-01',
    }),
    record('channel_permissions', 'role-allow', {
      channel: fixture.channel.id,
      targetType: 'role',
      targetId: role.id,
      allow: ['send_messages'],
      deny: ['attach_files'],
      created: '2026-01-02',
    }),
    record('channel_permissions', 'member-final', {
      channel: fixture.channel.id,
      targetType: 'member',
      targetId: fixture.membership.id,
      allow: ['attach_files'],
      deny: ['read_history'],
      created: '2026-01-03',
    }),
  )

  const resolved = permissions.communityPermissions(
    fixture.app,
    fixture.community.id,
    fixture.membership.getString('user'),
    fixture.channel.id,
  ).permissions
  assert.equal(resolved.includes('send_messages'), true)
  assert.equal(resolved.includes('attach_files'), true)
  assert.equal(resolved.includes('read_history'), false)
})

test('hidden channels remove dependent actions and records remain invisible', () => {
  const permissions = loadPermissions()
  const guard = loadChannelAccess()
  const fixture = communityFixture({
    permissions: ['view_channels', 'read_history', 'send_messages', 'connect_voice', 'speak'],
  })
  fixture.app.collection('channel_permissions').push(record('channel_permissions', 'hidden', {
    channel: fixture.channel.id,
    targetType: 'member',
    targetId: fixture.membership.id,
    allow: ['send_messages'],
    deny: ['view_channels'],
    created: '2026-01-01',
  }))
  const context = permissions.communityPermissions(
    fixture.app,
    fixture.community.id,
    fixture.membership.getString('user'),
    fixture.channel.id,
  )
  assert.equal(context.permissions.includes('view_channels'), false)
  assert.equal(context.permissions.includes('send_messages'), false)
  assert.equal(context.permissions.includes('read_history'), false)
  assert.equal(context.permissions.includes('connect_voice'), false)

  const message = record('messages', 'message', { channel: fixture.channel.id })
  assert.equal(guard.canViewRecord(fixture.app, fixture.channel, fixture.membership.getString('user')), false)
  assert.equal(guard.canViewRecord(fixture.app, message, fixture.membership.getString('user')), false)
  assert.equal(guard.canViewRecord(fixture.app, fixture.channel, ''), false)
})

test('timeouts retain visibility and history but revoke interaction and voice', () => {
  const permissions = loadPermissions()
  const fixture = communityFixture({
    permissions: permissions.DEFAULT_MEMBER_PERMISSIONS,
    timeoutUntil: new Date(Date.now() + 60_000).toISOString(),
  })
  const resolved = permissions.communityPermissions(
    fixture.app,
    fixture.community.id,
    fixture.membership.getString('user'),
    fixture.channel.id,
  ).permissions
  assert.equal(resolved.includes('view_channels'), true)
  assert.equal(resolved.includes('read_history'), true)
  for (const permission of ['send_messages', 'add_reactions', 'attach_files', 'connect_voice', 'speak']) {
    assert.equal(resolved.includes(permission), false)
  }
})

test('direct and group access each require an exact membership', () => {
  const permissions = loadPermissions()
  const fixture = communityFixture()
  fixture.app.collection('conversation_members').push(
    record('conversation_members', 'direct-member', {
      conversation: 'direct',
      user: 'member',
    }),
    record('conversation_members', 'group-member', {
      conversation: 'group',
      user: 'member',
    }),
  )
  for (const kind of ['direct', 'group']) {
    assert.equal(
      permissions.conversationMembership(fixture.app, kind, 'member').id,
      `${kind}-member`,
    )
    assert.throws(
      () => permissions.conversationMembership(fixture.app, kind, 'outsider'),
      /not a member of this conversation/i,
    )
  }
})
