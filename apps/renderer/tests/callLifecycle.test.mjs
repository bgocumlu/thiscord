import assert from 'node:assert/strict'
import test from 'node:test'

import { startConferenceLifecycle } from '../src/features/calls/conferenceLifecycle.ts'
import { attachLocalMediaAfterJoin } from '../src/features/calls/localTrackLifecycle.ts'
import {
  discardLocalTrack,
  enforceLocalMediaRejection,
  replacePublishedLocalTrack,
  rejectedLocalMedia,
  retainedTrackAllowed,
} from '../src/features/calls/localMediaPolicy.ts'
import {
  LOCAL_PARTICIPANT,
  mergeCallParticipants,
  participantFromJitsi,
  synchronizeParticipantTrack,
} from '../src/features/calls/participantSync.ts'
import { createPresenceHeartbeat } from '../src/features/calls/presenceHeartbeat.ts'
import { createRecoveryCoordinator } from '../src/features/calls/recoveryCoordinator.ts'
import {
  disposeRetainedMedia,
  releaseEngineResources,
} from '../src/features/calls/resourceLifecycle.ts'

function manualTimeoutScheduler() {
  const callbacks = new Map()
  let nextId = 1
  return {
    callbacks,
    scheduler: {
      setTimeout(callback) {
        const id = nextId++
        callbacks.set(id, callback)
        return id
      },
      clearTimeout(id) {
        callbacks.delete(id)
      },
    },
    runNext() {
      const [id, callback] = callbacks.entries().next().value ?? []
      if (!callback) return
      callbacks.delete(id)
      callback()
    },
  }
}

test('recovery coordinator schedules one retry at a time and exhausts after three attempts', () => {
  const clock = manualTimeoutScheduler()
  const scheduled = []
  let retries = 0
  let exhausted = 0
  const recovery = createRecoveryCoordinator({
    scheduler: clock.scheduler,
    onScheduled: (_message, attempt) => scheduled.push(attempt),
    onRetry: () => {
      retries += 1
    },
    onExhausted: () => {
      exhausted += 1
    },
  })

  assert.equal(recovery.recover('offline'), true)
  assert.equal(recovery.recover('duplicate'), true)
  assert.deepEqual(scheduled, [1])
  clock.runNext()
  assert.equal(retries, 1)
  recovery.recover('offline')
  clock.runNext()
  recovery.recover('offline')
  clock.runNext()
  assert.equal(recovery.recover('offline'), false)
  assert.deepEqual(scheduled, [1, 2, 3])
  assert.equal(exhausted, 1)

  recovery.reset()
  assert.equal(recovery.attempts(), 0)
  assert.equal(recovery.scheduled(), false)
})

test('presence heartbeat coalesces updates and stop drops backlog without waiting', async () => {
  const callbacks = new Map()
  const cleared = []
  let nextId = 1
  const heartbeat = createPresenceHeartbeat(10_000, {
    setInterval(callback) {
      const id = nextId++
      callbacks.set(id, callback)
      return id
    },
    clearInterval(id) {
      cleared.push(id)
      callbacks.delete(id)
    },
  })
  const reports = []
  let releaseFirst
  heartbeat.start(
    () => async () => {
      reports.push('update')
    },
    assert.fail,
    true,
    () => async () => {
      reports.push('joined:start')
      await new Promise((resolve) => {
        releaseFirst = resolve
      })
      reports.push('joined:end')
    },
  )
  await Promise.resolve()
  assert.deepEqual(reports, ['joined:start'])
  callbacks.get(1)()
  await Promise.resolve()
  assert.deepEqual(reports, ['joined:start'])
  assert.equal(heartbeat.active(), true)
  heartbeat.stop()
  assert.deepEqual(cleared, [1])
  assert.equal(heartbeat.active(), false)
  releaseFirst()
  await heartbeat.idle()
  assert.deepEqual(reports, ['joined:start', 'joined:end'])
})

test('resource release retains reconnect tracks but disposes final-leave tracks', async () => {
  const events = []
  const track = {
    getTrack() {
      return { stop() { events.push('media-stop') } }
    },
    async dispose() {
      events.push('track')
    },
  }
  const capturedTrack = {
    getTrack() {
      return { stop() { events.push('screen-media-stop') } }
    },
    async dispose() {
      events.push('screen-audio')
    },
  }
  const retained = await releaseEngineResources({
    connection: { async disconnect() { events.push('disconnect') } },
    conference: { async leave() { events.push('leave') } },
    localTracks: [track],
    screenAudio: { capturedTrack, microphoneTrack: track },
  }, true)

  assert.deepEqual(events, ['leave', 'disconnect'])
  assert.deepEqual(retained.retained.localTracks, [track])
  await disposeRetainedMedia(retained.retained)
  assert.deepEqual(events, [
    'leave',
    'disconnect',
    'media-stop',
    'track',
    'screen-media-stop',
    'screen-audio',
  ])

  events.length = 0
  await releaseEngineResources({
    connection: { async disconnect() { events.push('disconnect') } },
    conference: { async leave() { events.push('leave') } },
    localTracks: [track],
    screenAudio: { capturedTrack, microphoneTrack: track },
  }, false)
  assert.deepEqual(events, [
    'media-stop',
    'track',
    'screen-media-stop',
    'screen-audio',
    'leave',
    'disconnect',
  ])
})

test('retained tracks are filtered by current call permissions and ended state', () => {
  const audio = {
    getType: () => 'audio',
    isEnded: () => false,
  }
  const video = {
    getType: () => 'video',
    isEnded: () => false,
  }
  const ended = {
    getType: () => 'audio',
    isEnded: () => true,
  }
  assert.equal(retainedTrackAllowed(audio, { canSpeak: true, canStreamVideo: false }), true)
  assert.equal(retainedTrackAllowed(video, { canSpeak: true, canStreamVideo: false }), false)
  assert.equal(retainedTrackAllowed(ended, { canSpeak: true, canStreamVideo: true }), false)
})

test('revoked local media is muted or removed and disposed', async () => {
  const events = []
  const audio = {
    isMuted: () => false,
    async mute() {
      events.push('mute-audio')
    },
  }
  const camera = {
    async dispose() {
      events.push('dispose-camera')
    },
  }
  const screen = {
    async dispose() {
      events.push('dispose-screen')
    },
  }
  const participant = {
    audioTrack: audio,
    videoTrack: camera,
    screenTrack: screen,
  }
  const context = {
    conference: {
      async removeTrack(track) {
        events.push(track === camera ? 'remove-camera' : 'remove-screen')
      },
    },
    participant,
    removeTrack(track) {
      events.push(track === camera ? 'forget-camera' : 'forget-screen')
    },
    synchronizeTrack(track, remove, kind) {
      if (track === audio) events.push('sync-audio')
      else events.push(`sync-${kind}:${remove}`)
    },
    async stopScreenAudio() {
      events.push('stop-screen-audio')
    },
  }

  await enforceLocalMediaRejection('audio', context)
  await enforceLocalMediaRejection('video', context)
  await enforceLocalMediaRejection('desktop', context)
  assert.deepEqual(events, [
    'mute-audio',
    'sync-audio',
    'remove-camera',
    'sync-video:true',
    'forget-camera',
    'dispose-camera',
    'remove-screen',
    'sync-desktop:true',
    'forget-screen',
    'dispose-screen',
    'stop-screen-audio',
  ])
})

test('heartbeat capability downgrades enumerate every active local media source once', () => {
  const participant = {
    audioTrack: { isMuted: () => false },
    videoTrack: {},
    screenTrack: {},
  }
  assert.deepEqual(
    rejectedLocalMedia(participant, { canSpeak: false, canStreamVideo: false }),
    ['audio', 'video', 'desktop'],
  )
  participant.audioTrack = { isMuted: () => true }
  assert.deepEqual(
    rejectedLocalMedia(participant, { canSpeak: false, canStreamVideo: true }),
    [],
  )
})

test('failed local publication forgets and disposes the captured track', async () => {
  const events = []
  const track = {
    async dispose() {
      events.push('dispose')
    },
  }
  await discardLocalTrack(track, {
    conference: {
      async removeTrack() {
        events.push('remove')
        throw new Error('not published')
      },
    },
    removeTrack() {
      events.push('forget')
    },
    synchronizeTrack(_track, remove, kind) {
      events.push(`sync-${kind}:${remove}`)
    },
    localVideoKind: 'video',
  })
  assert.deepEqual(events, ['remove', 'sync-video:true', 'forget', 'dispose'])
})

test('published track replacement keeps the working track when Jitsi rejects the switch', async () => {
  const events = []
  const existing = {
    async dispose() {
      events.push('dispose-existing')
    },
  }
  const replacement = {}
  await assert.rejects(
    replacePublishedLocalTrack(existing, replacement, {
      conference: {
        async replaceTrack() {
          events.push('replace')
          throw new Error('publication failed')
        },
      },
      addTrack: () => events.push('add-replacement'),
      removeTrack: () => events.push('remove-existing'),
      synchronizeTrack: (_track, remove) => events.push(remove ? 'sync-remove' : 'sync-add'),
    }),
    /publication failed/i,
  )
  assert.deepEqual(events, ['replace'])
})

test('participant synchronization keeps camera and desktop tracks distinct', () => {
  const participants = new Map([[
    LOCAL_PARTICIPANT,
    {
      id: LOCAL_PARTICIPANT,
      userId: 'user',
      name: 'Local',
      local: true,
      audioTrack: null,
      videoTrack: null,
      screenTrack: null,
      muted: true,
      speaking: false,
    },
  ]])
  const camera = {
    isLocal: () => true,
    getParticipantId: () => '',
    getType: () => 'video',
    getVideoType: () => 'camera',
  }
  const desktop = {
    isLocal: () => true,
    getParticipantId: () => '',
    getType: () => 'video',
    getVideoType: () => '',
  }
  const localVideoKinds = new WeakMap()

  synchronizeParticipantTrack(participants, camera, { localVideoKinds })
  synchronizeParticipantTrack(participants, desktop, {
    localVideoKind: 'desktop',
    localVideoKinds,
  })
  assert.equal(participants.get(LOCAL_PARTICIPANT).videoTrack, camera)
  assert.equal(participants.get(LOCAL_PARTICIPANT).screenTrack, desktop)

  synchronizeParticipantTrack(participants, desktop, {
    remove: true,
    localVideoKinds,
  })
  assert.equal(participants.get(LOCAL_PARTICIPANT).videoTrack, camera)
  assert.equal(participants.get(LOCAL_PARTICIPANT).screenTrack, null)
})

test('unsigned Jitsi placeholders do not duplicate authoritative account occupancy', () => {
  const merged = mergeCallParticipants(
    [{
      id: 'unsigned-jitsi',
      userId: '',
      name: 'Same Name',
      local: false,
      audioTrack: null,
      videoTrack: null,
      screenTrack: null,
      muted: true,
      speaking: false,
    }],
    [{
      id: 'occupancy',
      call: 'call',
      user: 'signed-user',
      joinedAt: '',
      leftAt: '',
      expiresAt: '',
      muted: true,
      deafened: false,
      camera: false,
      sharing: false,
      created: '',
      updated: '',
      expand: {
        user: { id: 'signed-user', displayName: 'Same Name' },
        call: { expand: { room: { channel: 'voice' } } },
      },
    }],
    { kind: 'channel', id: 'voice' },
  )
  assert.equal(merged.length, 1)
  assert.equal(merged[0].id, 'presence:occupancy')
  assert.equal(merged[0].name, 'Same Name')
})

test('occupancy without an expanded user is not rendered with an invented name', () => {
  const merged = mergeCallParticipants(
    [],
    [{
      id: 'thin-occupancy',
      call: 'call',
      user: 'signed-user',
      joinedAt: '',
      leftAt: '',
      expiresAt: '',
      muted: true,
      serverMuted: false,
      deafened: false,
      camera: false,
      sharing: false,
      created: '',
      updated: '',
      expand: {
        call: { id: 'call', room: 'room', startedBy: '', endedAt: '', created: '', updated: '', expand: { room: { id: 'room', channel: 'voice', conversation: '', created: '', updated: '' } } },
      },
    }],
    { kind: 'channel', id: 'voice' },
  )

  assert.deepEqual(merged, [])
})

test('signed Jitsi participants inherit server-mute state and user identity from occupancy', () => {
  const user = { id: 'signed-user', displayName: 'Signed user' }
  const live = {
    id: 'signed-jitsi',
    userId: user.id,
    name: user.displayName,
    local: false,
    audioTrack: {},
    videoTrack: null,
    screenTrack: null,
    muted: false,
    serverMuted: false,
    speaking: true,
  }
  const merged = mergeCallParticipants(
    [live],
    [{
      id: 'occupancy',
      call: 'call',
      user: user.id,
      joinedAt: '',
      leftAt: '',
      expiresAt: '',
      muted: true,
      serverMuted: true,
      deafened: false,
      camera: false,
      sharing: false,
      created: '',
      updated: '',
      expand: {
        user,
        call: { expand: { room: { channel: 'voice' } } },
      },
    }],
    { kind: 'channel', id: 'voice' },
  )

  assert.equal(merged.length, 1)
  assert.equal(merged[0].id, live.id)
  assert.equal(merged[0].serverMuted, true)
  assert.equal(merged[0].user, user)
  assert.equal(merged[0].audioTrack, live.audioTrack)
})

test('verified Jitsi identity keeps remote camera and screen tracks on the account tile', () => {
  const user = { id: 'signed-media-user', displayName: 'Signed media user' }
  const camera = { kind: 'camera' }
  const screen = { kind: 'screen' }
  const live = {
    ...participantFromJitsi({
      getId: () => 'jitsi-media-participant',
      getIdentity: () => ({ user: { id: user.id } }),
      getDisplayName: () => user.displayName,
    }),
    videoTrack: camera,
    screenTrack: screen,
  }
  const merged = mergeCallParticipants(
    [live],
    [{
      id: 'occupancy',
      call: 'call',
      user: user.id,
      joinedAt: '',
      leftAt: '',
      expiresAt: '',
      muted: true,
      serverMuted: false,
      deafened: false,
      camera: true,
      sharing: true,
      created: '',
      updated: '',
      expand: {
        user,
        call: { expand: { room: { channel: 'voice' } } },
      },
    }],
    { kind: 'channel', id: 'voice' },
  )

  assert.equal(live.userId, user.id)
  assert.equal(merged.length, 1)
  assert.equal(merged[0].userId, user.id)
  assert.equal(merged[0].name, user.displayName)
  assert.equal(merged[0].videoTrack, camera)
  assert.equal(merged[0].screenTrack, screen)
})

test('the local device remains the single account tile when the same user joins twice', () => {
  const user = { id: 'same-account', displayName: 'Same account' }
  const participant = (id, local) => ({
    id,
    userId: user.id,
    name: user.displayName,
    local,
    audioTrack: null,
    videoTrack: null,
    screenTrack: null,
    muted: true,
    serverMuted: false,
    speaking: false,
  })
  const merged = mergeCallParticipants(
    [participant(LOCAL_PARTICIPANT, true), participant('second-device', false)],
    [{
      id: 'occupancy',
      call: 'call',
      user: user.id,
      joinedAt: '',
      leftAt: '',
      expiresAt: '',
      muted: true,
      serverMuted: false,
      deafened: false,
      camera: false,
      sharing: false,
      created: '',
      updated: '',
      expand: {
        user,
        call: { expand: { room: { channel: 'voice' } } },
      },
    }],
    { kind: 'channel', id: 'voice' },
  )

  assert.equal(merged.length, 1)
  assert.equal(merged[0].id, LOCAL_PARTICIPANT)
  assert.equal(merged[0].local, true)
})

test('conference lifecycle binds generic engine events and classifies recovery failures', () => {
  const connectionListeners = new Map()
  const conferenceListeners = new Map()
  const events = []
  const conference = {
    addEventListener(name, listener) {
      conferenceListeners.set(name, listener)
    },
    setDisplayName(name) {
      events.push(`name:${name}`)
    },
    getParticipants: () => [],
    join() {
      events.push('join')
    },
  }
  class Connection {
    addEventListener(name, listener) {
      connectionListeners.set(name, listener)
    }
    initJitsiConference(name) {
      events.push(`conference:${name}`)
      return conference
    }
    connect({ name }) {
      events.push(`connect:${name}`)
    }
  }
  const recovered = []
  const approvedMedia = []
  const rejectedMedia = []
  let rejected = 0
  let current = true
  const connection = startConferenceLifecycle({
    JitsiConnection: Connection,
    events: {
      connection: {
        CONNECTION_FAILED: 'connection-failed',
        CONNECTION_DISCONNECTED: 'connection-disconnected',
        CONNECTION_ESTABLISHED: 'connection-established',
      },
      conference: {
        USER_JOINED: 'user-joined',
        USER_LEFT: 'user-left',
        DISPLAY_NAME_CHANGED: 'display-name',
        TRACK_ADDED: 'track-added',
        TRACK_REMOVED: 'track-removed',
        AV_MODERATION_APPROVED: 'media-approved',
        AV_MODERATION_REJECTED: 'media-rejected',
        CONFERENCE_JOINED: 'conference-joined',
        CONFERENCE_FAILED: 'conference-failed',
        KICKED: 'conference-kicked',
        CONNECTION_INTERRUPTED: 'conference-interrupted',
        CONNECTION_RESTORED: 'conference-restored',
      },
    },
  }, {
    jwt: 'jwt',
    url: 'https://meet.example.test',
    roomName: 'opaque-room',
    displayName: 'Caller',
  }, {
    current: () => current,
    recover: (reason) => recovered.push(reason),
    onConferenceCreated: () => events.push('created'),
    onConferenceStarted: () => events.push('started'),
    onParticipantJoined: () => undefined,
    onParticipantLeft: () => undefined,
    onDisplayNameChanged: () => undefined,
    onTrackAdded: () => undefined,
    onTrackRemoved: () => undefined,
    onMediaPolicyApproved: (mediaType) => approvedMedia.push(mediaType),
    onMediaPolicyRejected: (mediaType) => rejectedMedia.push(mediaType),
    onJoined: () => events.push('joined'),
    onRejected: () => {
      rejected += 1
    },
    onKicked: () => events.push('kicked'),
    onInterrupted: () => events.push('interrupted'),
    onRestored: () => events.push('restored'),
  })

  assert.equal(connection instanceof Connection, true)
  assert.deepEqual(events, ['connect:opaque-room'])
  connectionListeners.get('connection-established')()
  assert.deepEqual(events, [
    'connect:opaque-room',
    'conference:opaque-room',
    'created',
    'name:Caller',
    'join',
    'started',
  ])
  conferenceListeners.get('conference-joined')()
  conferenceListeners.get('media-approved')({ mediaType: 'audio' })
  conferenceListeners.get('media-rejected')({ mediaType: 'desktop' })
  conferenceListeners.get('conference-failed')('conference.iceFailed')
  conferenceListeners.get('conference-failed')('conference.notAllowed')
  conferenceListeners.get('conference-kicked')()
  assert.equal(events.includes('joined'), true)
  assert.deepEqual(approvedMedia, ['audio'])
  assert.deepEqual(rejectedMedia, ['desktop'])
  assert.deepEqual(recovered, ['The call connection was interrupted.'])
  assert.equal(rejected, 1)
  assert.equal(events.includes('kicked'), true)

  current = false
  connectionListeners.get('connection-failed')()
  assert.equal(recovered.length, 1)
})

test('local-track lifecycle republishes allowed retained media and disposes revoked media', async () => {
  const events = []
  const audio = {
    getType: () => 'audio',
    isEnded: () => false,
    async dispose() {
      events.push('dispose-audio')
    },
  }
  const video = {
    getType: () => 'video',
    getVideoType: () => 'camera',
    isEnded: () => false,
    async dispose() {
      events.push('dispose-video')
    },
  }
  const resources = {
    connection: null,
    conference: null,
    localTracks: [audio, video],
    screenAudio: null,
  }
  await attachLocalMediaAfterJoin({
    jitsi: {
      async createLocalTracks() {
        throw new Error('an audio track is already retained')
      },
    },
    conference: {
      async addTrack(track) {
        events.push(track === audio ? 'add-audio' : 'add-video')
      },
    },
    info: { canSpeak: true, canStreamVideo: false },
    resources,
    localVideoKinds: new WeakMap(),
    microphoneDeviceId: '',
    microphoneMuted: false,
    deafened: false,
    current: () => true,
    observeTrack: (track) => events.push(track === audio ? 'observe-audio' : 'observe-video'),
    setTrack: (track, remove) => {
      if (track === video && remove) events.push('remove-video')
    },
    stopScreenAudio: async () => undefined,
    refreshDevices: async () => {
      events.push('devices')
    },
  })

  assert.deepEqual(resources.localTracks, [audio])
  assert.deepEqual(events, [
    'observe-audio',
    'add-audio',
    'remove-video',
    'dispose-video',
    'devices',
  ])
})

test('rejecting retained desktop video also stops its mixed screen audio', async () => {
  const events = []
  const microphone = {
    getType: () => 'audio',
    isEnded: () => false,
  }
  const desktop = {
    getType: () => 'video',
    getVideoType: () => 'desktop',
    isEnded: () => false,
    async dispose() {
      events.push('dispose-desktop')
    },
  }
  const resources = {
    connection: null,
    conference: null,
    localTracks: [microphone, desktop],
    screenAudio: { capturedTrack: {}, microphoneTrack: microphone },
  }
  await attachLocalMediaAfterJoin({
    jitsi: { async createLocalTracks() { throw new Error('audio retained') } },
    conference: { async addTrack() {} },
    info: { canSpeak: true, canStreamVideo: false },
    resources,
    localVideoKinds: new WeakMap([[desktop, 'desktop']]),
    microphoneDeviceId: '',
    microphoneMuted: false,
    deafened: false,
    current: () => true,
    observeTrack: () => undefined,
    setTrack: (track, remove) => {
      if (track === desktop && remove) events.push('remove-desktop')
    },
    stopScreenAudio: async () => {
      events.push('stop-screen-audio')
      resources.screenAudio = null
    },
    refreshDevices: async () => undefined,
  })

  assert.deepEqual(resources.localTracks, [microphone])
  assert.deepEqual(events, [
    'remove-desktop',
    'dispose-desktop',
    'stop-screen-audio',
  ])
})
