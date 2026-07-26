/* eslint-disable react-refresh/only-export-components */
import type { CallParticipantRecord, Channel, DesktopCaptureSource, JitsiJoin, User } from '@thiscord/shared'
import type {
  JitsiConference,
  JitsiConnection,
  JitsiMeetApi,
  JitsiParticipant,
  JitsiTrack,
} from 'lib-jitsi-meet'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { usePocketBase } from '../lib/contexts'
import { errorMessage } from '../lib/pocketbase'

export type CallStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error'

export interface CallParticipant {
  readonly id: string
  readonly userId: string
  readonly name: string
  readonly local: boolean
  readonly audioTrack: JitsiTrack | null
  readonly videoTrack: JitsiTrack | null
  readonly screenTrack: JitsiTrack | null
  readonly muted: boolean
  readonly speaking: boolean
}

export interface CallSession {
  readonly channel: Channel
  readonly status: Exclude<CallStatus, 'idle'>
  readonly error: string
  readonly participants: readonly CallParticipant[]
  readonly microphoneMuted: boolean
  readonly deafened: boolean
  readonly cameraEnabled: boolean
  readonly screenSharing: boolean
  readonly actionBusy: boolean
  readonly moderator: boolean
  readonly canSpeak: boolean
  readonly canStreamVideo: boolean
  readonly canMuteMembers: boolean
  readonly canRemoveMembers: boolean
}

interface CallContextValue {
  readonly session: CallSession | null
  readonly microphoneMuted: boolean
  readonly deafened: boolean
  readonly join: (channel: Channel) => Promise<void>
  readonly leave: () => Promise<void>
  readonly retry: () => Promise<void>
  readonly toggleMicrophone: () => Promise<void>
  readonly toggleDeafen: () => Promise<void>
  readonly toggleCamera: () => Promise<void>
  readonly toggleScreenShare: () => Promise<void>
  readonly devices: readonly MediaDeviceInfo[]
  readonly microphoneDeviceId: string
  readonly cameraDeviceId: string
  readonly speakerDeviceId: string
  readonly refreshDevices: () => Promise<void>
  readonly selectMicrophone: (deviceId: string) => Promise<void>
  readonly selectCamera: (deviceId: string) => Promise<void>
  readonly selectSpeaker: (deviceId: string) => Promise<void>
  readonly prioritizeVideo: (
    screenTrack: JitsiTrack | null,
    videoTrack: JitsiTrack | null,
    local: boolean,
  ) => void
  readonly moderateParticipant: (participantId: string, action: 'mute' | 'kick') => Promise<void>
}

interface MutableParticipant {
  id: string
  userId: string
  name: string
  local: boolean
  audioTrack: JitsiTrack | null
  videoTrack: JitsiTrack | null
  screenTrack: JitsiTrack | null
  muted: boolean
  speaking: boolean
}

interface EngineResources {
  connection: JitsiConnection | null
  conference: JitsiConference | null
  localTracks: JitsiTrack[]
}

const CallContext = createContext<CallContextValue | null>(null)
const LOCAL_PARTICIPANT = 'local'
const MAX_AUTOMATIC_RECONNECTS = 3
const JITSI_RELOAD_AT_KEY = 'thiscord_jitsi_reload_at'
const JITSI_RESUME_CHANNEL_KEY = 'thiscord_jitsi_resume_channel'
let jitsiApi: JitsiMeetApi | null = null
let jitsiApiPromise: Promise<JitsiMeetApi> | null = null

function isStaleJitsiModule(caught: unknown) {
  const message = errorMessage(caught)
  return /failed to fetch dynamically imported module|importing a module script failed|error loading dynamically imported module/i.test(message)
    && /lib-jitsi-meet|\/assets\//i.test(message)
}

function reloadForFreshJitsiModule(channelId: string) {
  const lastReload = Number(sessionStorage.getItem(JITSI_RELOAD_AT_KEY) || 0)
  if (Date.now() - lastReload < 30_000) return false
  sessionStorage.setItem(JITSI_RELOAD_AT_KEY, String(Date.now()))
  sessionStorage.setItem(JITSI_RESUME_CHANNEL_KEY, channelId)
  window.location.reload()
  return true
}

async function loadJitsi() {
  if (!jitsiApiPromise) {
    jitsiApiPromise = import('lib-jitsi-meet').then(({ default: api }) => {
      api.init({
        disableAudioLevels: false,
        disableThirdPartyRequests: true,
        enableAnalyticsLogging: false,
        flags: { runInLiteMode: true },
      })
      if (api.logLevels.ERROR) api.setLogLevel(api.logLevels.ERROR)
      jitsiApi = api
      return api
    }).catch((caught: unknown) => {
      jitsiApiPromise = null
      throw caught
    })
  }
  return jitsiApiPromise
}

function mediaErrorMessage(caught: unknown, device: 'microphone' | 'camera' | 'screen') {
  const message = errorMessage(caught)
  if (/denied|notallowed|permission/i.test(message)) {
    if (device === 'screen') return 'Screen sharing was cancelled or blocked.'
    return `${device === 'microphone' ? 'Microphone' : 'Camera'} access is blocked in this app’s permissions.`
  }
  if (/not found|notfound/i.test(message)) {
    return device === 'screen'
      ? 'Screen sharing is not available in this browser.'
      : `No ${device} was found.`
  }
  return message
}

function connectionOptions(origin: string) {
  const base = new URL(origin)
  return {
    enableWebsocketResume: false,
    hosts: {
      domain: 'meet.jitsi',
      muc: 'muc.meet.jitsi',
    },
    p2pStunServers: [],
    serviceUrl: new URL('/http-bind', base).toString(),
    websocketKeepAlive: 0,
  }
}

function emptyResources(): EngineResources {
  return { connection: null, conference: null, localTracks: [] }
}

function participantFromJitsi(participant: JitsiParticipant): MutableParticipant {
  const identity = (participant as JitsiParticipant & { getIdentity?: () => unknown }).getIdentity?.() as {
    readonly id?: unknown
    readonly user?: { readonly id?: unknown }
  } | undefined
  const identityId = identity?.user?.id ?? identity?.id
  return {
    id: participant.getId(),
    userId: typeof identityId === 'string' ? identityId : '',
    name: participant.getDisplayName() || 'Participant',
    local: false,
    audioTrack: null,
    videoTrack: null,
    screenTrack: null,
    muted: true,
    speaking: false,
  }
}

export function mergeCallParticipants(
  liveParticipants: readonly CallParticipant[],
  occupancy: readonly CallParticipantRecord[],
  channelId: string,
) {
  const merged = new Map<string, CallParticipant>()
  for (const record of occupancy) {
    if (record.expand?.call?.channel !== channelId) continue
    const user = record.expand?.user
    merged.set(`user:${record.user}`, {
      id: `presence:${record.id}`,
      userId: record.user,
      name: user?.displayName || user?.handle || 'Member',
      local: false,
      audioTrack: null,
      videoTrack: null,
      screenTrack: null,
      muted: record.muted,
      speaking: false,
    })
  }
  for (const participant of liveParticipants) {
    let key = participant.userId ? `user:${participant.userId}` : `jitsi:${participant.id}`
    if (!participant.userId) {
      const normalizedName = participant.name.trim().toLocaleLowerCase()
      const nameMatches = [...merged.entries()].filter(([, existing]) => (
        existing.name.trim().toLocaleLowerCase() === normalizedName
      ))
      if (nameMatches.length === 1) key = nameMatches[0][0]
    }
    merged.set(key, participant)
  }
  return [...merged.values()]
}

export function CallProvider({ user, children }: {
  readonly user: User
  readonly children: ReactNode
}) {
  const client = usePocketBase()
  const queryClient = useQueryClient()
  const resources = useRef<EngineResources>(emptyResources())
  const participants = useRef(new Map<string, MutableParticipant>())
  const generation = useRef(0)
  const activeChannel = useRef<Channel | null>(null)
  const presenceTimer = useRef<number | null>(null)
  const reconnectTimer = useRef<number | null>(null)
  const reconnectAttempts = useRef(0)
  const joinRef = useRef<(channel: Channel, automatic?: boolean) => Promise<void>>(async () => undefined)
  const reportCallPresenceRef = useRef<(state: 'joined' | 'update' | 'left') => Promise<void>>(async () => undefined)
  const observedTracks = useRef(new WeakSet<JitsiTrack>())
  const localVideoKinds = useRef(new WeakMap<JitsiTrack, 'video' | 'desktop'>())
  const [preferredMicrophoneMuted, setPreferredMicrophoneMuted] = useState(
    () => localStorage.getItem('thiscord_voice_muted') === 'true',
  )
  const [preferredDeafened, setPreferredDeafened] = useState(
    () => localStorage.getItem('thiscord_voice_deafened') === 'true',
  )
  const deafened = useRef(preferredDeafened)
  const [session, setSession] = useState<CallSession | null>(null)
  const [screenSources, setScreenSources] = useState<readonly DesktopCaptureSource[]>([])
  const [screenPickerError, setScreenPickerError] = useState('')
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [microphoneDeviceId, setMicrophoneDeviceId] = useState(() => localStorage.getItem('thiscord_microphone') ?? '')
  const [cameraDeviceId, setCameraDeviceId] = useState(() => localStorage.getItem('thiscord_camera') ?? '')
  const [speakerDeviceId, setSpeakerDeviceId] = useState(() => localStorage.getItem('thiscord_speaker') ?? '')

  const publish = useCallback((patch?: Partial<CallSession>) => {
    const channel = activeChannel.current
    if (!channel) {
      setSession(null)
      return
    }
    const localParticipant = participants.current.get(LOCAL_PARTICIPANT)
    setSession((current) => ({
      channel,
      status: current?.status ?? 'connecting',
      error: current?.error ?? '',
      microphoneMuted: current?.microphoneMuted ?? preferredMicrophoneMuted,
      deafened: current?.deafened ?? preferredDeafened,
      actionBusy: current?.actionBusy ?? false,
      moderator: current?.moderator ?? false,
      canSpeak: current?.canSpeak ?? false,
      canStreamVideo: current?.canStreamVideo ?? false,
      canMuteMembers: current?.canMuteMembers ?? false,
      canRemoveMembers: current?.canRemoveMembers ?? false,
      participants: [...participants.current.values()].map((participant) => ({ ...participant })),
      ...patch,
      cameraEnabled: Boolean(localParticipant?.videoTrack),
      screenSharing: Boolean(localParticipant?.screenTrack),
    }))
  }, [preferredDeafened, preferredMicrophoneMuted])

  const setTrack = useCallback((track: JitsiTrack, remove = false, localVideoKind?: 'video' | 'desktop') => {
    const participantId = track.isLocal() ? LOCAL_PARTICIPANT : track.getParticipantId()
    let participant = participants.current.get(participantId)
    if (!participant && !track.isLocal()) {
      participant = {
        id: participantId,
        userId: '',
        name: 'Participant',
        local: false,
        audioTrack: null,
        videoTrack: null,
        screenTrack: null,
        muted: true,
        speaking: false,
      }
      participants.current.set(participantId, participant)
    }
    if (!participant) return
    const type = track.getType()
    if (remove) {
      if (participant.audioTrack === track) participant.audioTrack = null
      if (participant.videoTrack === track) participant.videoTrack = null
      if (participant.screenTrack === track) participant.screenTrack = null
    } else if (type === 'audio') {
      participant.audioTrack = track
    } else {
      const reportedVideoType = String(track.getVideoType() ?? '')
      const rememberedVideoKind = track.isLocal() ? localVideoKinds.current.get(track) : undefined
      const effectiveVideoKind = localVideoKind
        ?? (reportedVideoType ? (reportedVideoType.startsWith('desktop') ? 'desktop' : 'video') : rememberedVideoKind)
      if (track.isLocal() && effectiveVideoKind) localVideoKinds.current.set(track, effectiveVideoKind)
      const screenTrack = effectiveVideoKind === 'desktop'
        || (effectiveVideoKind === undefined && participant.screenTrack === track)
      if (screenTrack) {
        participant.screenTrack = track
        if (participant.videoTrack === track) participant.videoTrack = null
      } else {
        participant.videoTrack = track
        if (participant.screenTrack === track) participant.screenTrack = null
      }
    }
    participant.muted = participant.audioTrack?.isMuted() ?? true
    publish({
      microphoneMuted: participants.current.get(LOCAL_PARTICIPANT)?.audioTrack?.isMuted() ?? true,
    })
  }, [publish])

  const observeTrack = useCallback((track: JitsiTrack, localVideoKind?: 'video' | 'desktop') => {
    const events = jitsiApi?.events.track
    if (!events) return
    if (observedTracks.current.has(track)) {
      setTrack(track, false, localVideoKind)
      return
    }
    observedTracks.current.add(track)
    const syncMute = () => setTrack(track, false, localVideoKind)
    const syncLevel = (level: unknown) => {
      const participantId = track.isLocal() ? LOCAL_PARTICIPANT : track.getParticipantId()
      const participant = participants.current.get(participantId)
      if (!participant || typeof level !== 'number') return
      const speaking = level > 0.18
      if (participant.speaking !== speaking) {
        participant.speaking = speaking
        publish()
      }
    }
    track.addEventListener(events.TRACK_MUTE_CHANGED, syncMute)
    track.addEventListener(events.TRACK_AUDIO_LEVEL_CHANGED, syncLevel)
    if (events.TRACK_VIDEOTYPE_CHANGED) {
      track.addEventListener(events.TRACK_VIDEOTYPE_CHANGED, syncMute)
    }
    if (track.isLocal()) {
      const handleLocalTrackStopped = () => {
        if (!resources.current.localTracks.includes(track)) return
        resources.current.localTracks = resources.current.localTracks.filter((item) => item !== track)
        setTrack(track, true)
        const conference = resources.current.conference
        if (conference) void conference.removeTrack(track).catch(() => undefined)
        void reportCallPresenceRef.current('update').catch(() => undefined)
      }
      if (events.LOCAL_TRACK_STOPPED) {
        track.addEventListener(events.LOCAL_TRACK_STOPPED, handleLocalTrackStopped)
      }
      const mediaTrack = (track as JitsiTrack & { getTrack?: () => MediaStreamTrack }).getTrack?.()
      mediaTrack?.addEventListener('ended', handleLocalTrackStopped, { once: true })
    }
    setTrack(track, false, localVideoKind)
  }, [publish, setTrack])

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      setDevices([])
      return
    }
    setDevices(await navigator.mediaDevices.enumerateDevices())
  }, [])

  const reportCallPresence = useCallback(async (state: 'joined' | 'update' | 'left') => {
    const channel = activeChannel.current
    if (!channel) return
    const local = participants.current.get(LOCAL_PARTICIPANT)
    await client.send(`/api/thiscord/channels/${channel.id}/call-presence`, {
      method: 'POST',
      body: {
        state,
        muted: local?.audioTrack?.isMuted() ?? true,
        deafened: deafened.current,
        camera: Boolean(local?.videoTrack),
        sharing: Boolean(local?.screenTrack),
      },
    })
    await queryClient.invalidateQueries({ queryKey: ['voice_occupancy'] })
  }, [client, queryClient])
  useEffect(() => {
    reportCallPresenceRef.current = reportCallPresence
  }, [reportCallPresence])

  const releaseResources = useCallback(async ({
    preserveLocalTracks = false,
    announceDeparture = true,
  }: {
    readonly preserveLocalTracks?: boolean
    readonly announceDeparture?: boolean
  } = {}) => {
    if (reconnectTimer.current !== null) {
      window.clearTimeout(reconnectTimer.current)
      reconnectTimer.current = null
    }
    if (presenceTimer.current !== null) {
      window.clearInterval(presenceTimer.current)
      presenceTimer.current = null
    }
    if (activeChannel.current && announceDeparture) {
      try {
        await reportCallPresence('left')
      } catch {
        // Expiry cleanup removes a stale participant if the final request cannot be delivered.
      }
    }
    const current = resources.current
    resources.current = emptyResources()
    const tracks = [...current.localTracks]
    current.localTracks.length = 0
    try {
      if (current.conference) await current.conference.leave('user-left')
    } catch {
      // Conference disposal continues even if the leave stanza fails.
    }
    if (!preserveLocalTracks) {
      for (const track of tracks) {
        try {
          await track.dispose()
        } catch {
          // A browser may have already ended a shared display track.
        }
      }
    }
    try {
      if (current.connection) await current.connection.disconnect()
    } catch {
      // The transport can already be disconnected after a network failure.
    }
    participants.current.clear()
    return preserveLocalTracks ? tracks : []
  }, [reportCallPresence])

  const leave = useCallback(async () => {
    generation.current += 1
    reconnectAttempts.current = 0
    setScreenSources([])
    setScreenPickerError('')
    await releaseResources()
    activeChannel.current = null
    setSession(null)
  }, [releaseResources])

  const join = useCallback(async (channel: Channel, automatic = false) => {
    if (
      activeChannel.current?.id === channel.id
      && !automatic
      && session?.status !== 'error'
    ) return

    if (!automatic) reconnectAttempts.current = 0
    const requestGeneration = generation.current + 1
    generation.current = requestGeneration
    const retainedLocalTracks = await releaseResources({
      preserveLocalTracks: automatic,
      announceDeparture: !automatic,
    })
    if (generation.current !== requestGeneration) {
      await Promise.all(retainedLocalTracks.map((track) => track.dispose().catch(() => undefined)))
      return
    }

    activeChannel.current = channel
    deafened.current = preferredDeafened
    participants.current.set(LOCAL_PARTICIPANT, {
      id: LOCAL_PARTICIPANT,
      userId: user.id,
      name: user.displayName,
      local: true,
      audioTrack: null,
      videoTrack: null,
      screenTrack: null,
      muted: preferredMicrophoneMuted || preferredDeafened,
      speaking: false,
    })
    resources.current.localTracks.push(...retainedLocalTracks)
    for (const track of retainedLocalTracks) {
      const retainedKind = track.getType() === 'video'
        ? localVideoKinds.current.get(track)
          ?? (String(track.getVideoType() ?? '').startsWith('desktop') ? 'desktop' : 'video')
        : undefined
      observeTrack(track, retainedKind)
    }
    publish({
      status: automatic ? 'reconnecting' : 'connecting',
      error: '',
      actionBusy: false,
      moderator: false,
      canSpeak: false,
      canStreamVideo: false,
      canMuteMembers: false,
      canRemoveMembers: false,
      microphoneMuted: preferredMicrophoneMuted || preferredDeafened,
      deafened: preferredDeafened,
    })

    try {
      const jitsi = await loadJitsi()
      sessionStorage.removeItem(JITSI_RELOAD_AT_KEY)
      const info = await client.send<JitsiJoin>(`/api/thiscord/channels/${channel.id}/jitsi-token`, {})
      if (generation.current !== requestGeneration) return
      publish({
        moderator: info.moderator,
        canSpeak: info.canSpeak,
        canStreamVideo: info.canStreamVideo,
        canMuteMembers: info.canMuteMembers,
        canRemoveMembers: info.canRemoveMembers,
      })

      const connection = new jitsi.JitsiConnection(null, info.jwt, connectionOptions(info.url))
      resources.current.connection = connection
      const connectionEvents = jitsi.events.connection
      const conferenceEvents = jitsi.events.conference
      const recover = (reason: string) => {
        if (generation.current !== requestGeneration || reconnectTimer.current !== null) return
        const attempt = reconnectAttempts.current + 1
        if (attempt > MAX_AUTOMATIC_RECONNECTS) {
          if (presenceTimer.current !== null) {
            window.clearInterval(presenceTimer.current)
            presenceTimer.current = null
          }
          publish({
            status: 'error',
            error: 'Couldn’t recover the media connection. Check the network or media server, then retry.',
          })
          void reportCallPresence('left').catch(() => undefined)
          return
        }
        reconnectAttempts.current = attempt
        const delay = Math.min(750 * (2 ** (attempt - 1)), 3_000)
        publish({
          status: 'reconnecting',
          error: `${reason} Reconnecting (${attempt}/${MAX_AUTOMATIC_RECONNECTS})…`,
        })
        reconnectTimer.current = window.setTimeout(() => {
          reconnectTimer.current = null
          if (generation.current === requestGeneration && activeChannel.current?.id === channel.id) {
            void joinRef.current(channel, true)
          }
        }, delay)
      }

      connection.addEventListener(connectionEvents.CONNECTION_FAILED, () => {
        if (generation.current !== requestGeneration) return
        recover('Couldn’t reach the media server.')
      })
      connection.addEventListener(connectionEvents.CONNECTION_DISCONNECTED, () => {
        if (generation.current === requestGeneration && activeChannel.current) {
          recover('The media connection was interrupted.')
        }
      })
      connection.addEventListener(connectionEvents.CONNECTION_ESTABLISHED, async () => {
        if (generation.current !== requestGeneration) return
        const conference = connection.initJitsiConference(info.roomName, {
          openBridgeChannel: 'datachannel',
          p2p: { enabled: false, stunServers: [] },
          startSilent: false,
        })
        resources.current.conference = conference
        conference.setDisplayName(info.displayName)

        conference.addEventListener(conferenceEvents.USER_JOINED, (_id, participant) => {
          const remote = participant as JitsiParticipant
          const fresh = participantFromJitsi(remote)
          const existing = participants.current.get(remote.getId())
          participants.current.set(remote.getId(), {
            ...fresh,
            ...existing,
            userId: fresh.userId || existing?.userId || '',
            name: remote.getDisplayName() || existing?.name || 'Participant',
          })
          publish()
        })
        conference.addEventListener(conferenceEvents.USER_LEFT, (id) => {
          participants.current.delete(String(id))
          publish()
        })
        conference.addEventListener(conferenceEvents.DISPLAY_NAME_CHANGED, (id, name) => {
          const participant = participants.current.get(String(id))
          if (participant) {
            participant.name = String(name || 'Participant')
            publish()
          }
        })
        conference.addEventListener(conferenceEvents.TRACK_ADDED, (value) => {
          observeTrack(value as JitsiTrack)
        })
        conference.addEventListener(conferenceEvents.TRACK_REMOVED, (value) => {
          setTrack(value as JitsiTrack, true)
        })
        conference.addEventListener(conferenceEvents.CONFERENCE_JOINED, () => {
          if (generation.current !== requestGeneration) return
          reconnectAttempts.current = 0
          conference.setReceiverConstraints({
            lastN: 25,
            defaultConstraints: { maxHeight: 720 },
            constraints: {},
          })
          publish({ status: 'connected', error: '' })
          void reportCallPresence('joined')
          if (presenceTimer.current !== null) window.clearInterval(presenceTimer.current)
          presenceTimer.current = window.setInterval(() => {
            void reportCallPresence('update').catch(() => undefined)
          }, 25_000)
        })
        conference.addEventListener(conferenceEvents.CONFERENCE_FAILED, (...details) => {
          if (generation.current !== requestGeneration) return
          const code = String(details[0] || '')
          if ([
            'conference.iceFailed',
            'conference.focusDisconnected',
            'conference.videobridgeNotAvailable',
            'conference.connectionError',
            'conference.offerAnswerFailed',
          ].includes(code)) {
            recover('The voice connection was interrupted.')
            return
          }
          publish({ status: 'error', error: 'The media server rejected this voice session. Retry the connection.' })
          if (presenceTimer.current !== null) {
            window.clearInterval(presenceTimer.current)
            presenceTimer.current = null
          }
          void reportCallPresence('left').catch(() => undefined)
        })
        conference.addEventListener(conferenceEvents.CONNECTION_INTERRUPTED, () => {
          if (generation.current === requestGeneration) publish({ status: 'reconnecting' })
        })
        conference.addEventListener(conferenceEvents.CONNECTION_RESTORED, () => {
          if (generation.current === requestGeneration) publish({ status: 'connected', error: '' })
        })

        for (const remote of conference.getParticipants()) {
          participants.current.set(remote.getId(), participantFromJitsi(remote))
        }

        conference.join()
        try {
          const retainedTracks = [...resources.current.localTracks]
          for (const track of retainedTracks) {
            const permitted = track.getType() === 'audio' ? info.canSpeak : info.canStreamVideo
            const ended = (track as JitsiTrack & { isEnded?: () => boolean }).isEnded?.() ?? false
            if (!permitted || ended) {
              resources.current.localTracks = resources.current.localTracks.filter((item) => item !== track)
              setTrack(track, true)
              await track.dispose().catch(() => undefined)
              continue
            }
            const retainedKind = track.getType() === 'video'
              ? localVideoKinds.current.get(track)
                ?? (String(track.getVideoType() ?? '').startsWith('desktop') ? 'desktop' : 'video')
              : undefined
            observeTrack(track, retainedKind)
            try {
              await conference.addTrack(track)
            } catch {
              resources.current.localTracks = resources.current.localTracks.filter((item) => item !== track)
              setTrack(track, true)
              await track.dispose().catch(() => undefined)
            }
          }

          const hasAudio = resources.current.localTracks.some((track) => track.getType() === 'audio')
          if (info.canSpeak && !hasAudio) {
            const localTracks = await jitsi.createLocalTracks({
              devices: ['audio'],
              ...(microphoneDeviceId ? { micDeviceId: microphoneDeviceId } : {}),
            })
            if (generation.current !== requestGeneration) {
              await Promise.all(localTracks.map((track) => track.dispose()))
              return
            }
            resources.current.localTracks.push(...localTracks)
            for (const track of localTracks) {
              if (preferredMicrophoneMuted || preferredDeafened) await track.mute()
              try {
                observeTrack(track)
                await conference.addTrack(track)
              } catch (caught) {
                resources.current.localTracks = resources.current.localTracks.filter((item) => item !== track)
                setTrack(track, true)
                await track.dispose().catch(() => undefined)
                throw caught
              }
            }
          }
          void refreshDevices()
        } catch {
          // Receive-only joining remains available when microphone permission is denied.
        }
      })
      connection.connect({ name: info.roomName })
    } catch (caught) {
      if (generation.current === requestGeneration) {
        if (isStaleJitsiModule(caught) && reloadForFreshJitsiModule(channel.id)) return
        publish({ status: 'error', error: errorMessage(caught) })
      }
    }
  }, [client, microphoneDeviceId, observeTrack, preferredDeafened, preferredMicrophoneMuted, publish, refreshDevices, releaseResources, reportCallPresence, session, setTrack, user.displayName, user.id])

  useEffect(() => {
    joinRef.current = join
  }, [join])

  const retry = useCallback(async () => {
    if (activeChannel.current) await join(activeChannel.current)
  }, [join])

  const prioritizeVideo = useCallback((
    screenTrack: JitsiTrack | null,
    videoTrack: JitsiTrack | null,
    local: boolean,
  ) => {
    const conference = resources.current.conference
    if (!conference) return
    const preferredTracks = !local
      ? [screenTrack, videoTrack].filter((track): track is JitsiTrack => Boolean(track))
      : []
    const constraints: Record<string, { maxHeight: number }> = {}
    for (const track of preferredTracks) {
      const sourceName = track.getSourceName()
      if (sourceName) constraints[sourceName] = { maxHeight: 1080 }
    }
    conference.setReceiverConstraints({
      lastN: 25,
      defaultConstraints: { maxHeight: preferredTracks.length ? 360 : 720 },
      constraints,
    })
  }, [])

  const rememberMuted = useCallback((muted: boolean) => {
    setPreferredMicrophoneMuted(muted)
    localStorage.setItem('thiscord_voice_muted', String(muted))
  }, [])

  const rememberDeafened = useCallback((nextDeafened: boolean) => {
    setPreferredDeafened(nextDeafened)
    deafened.current = nextDeafened
    localStorage.setItem('thiscord_voice_deafened', String(nextDeafened))
  }, [])

  const toggleMicrophone = useCallback(async () => {
    const conference = resources.current.conference
    if (!conference || !activeChannel.current || !session) {
      const nextMuted = !preferredMicrophoneMuted
      rememberMuted(nextMuted)
      if (!nextMuted && preferredDeafened) rememberDeafened(false)
      if (activeChannel.current) publish({ microphoneMuted: nextMuted, deafened: nextMuted ? preferredDeafened : false })
      return
    }
    if (!session?.canSpeak) {
      publish({ error: 'You do not have permission to speak in this voice channel.' })
      return
    }
    const local = participants.current.get(LOCAL_PARTICIPANT)
    const audio = local?.audioTrack
    publish({ actionBusy: true })
    try {
      if (audio) {
        if (audio.isMuted()) await audio.unmute()
        else await audio.mute()
        setTrack(audio)
        rememberMuted(audio.isMuted())
      } else {
        const jitsi = await loadJitsi()
        const tracks = await jitsi.createLocalTracks({
          devices: ['audio'],
          ...(microphoneDeviceId ? { micDeviceId: microphoneDeviceId } : {}),
        })
        for (const track of tracks) {
          resources.current.localTracks.push(track)
          observeTrack(track)
          await conference.addTrack(track)
        }
        rememberMuted(false)
      }
      publish({ deafened: false, error: '' })
      rememberDeafened(false)
      void reportCallPresence('update')
    } catch (caught) {
      publish({ error: mediaErrorMessage(caught, 'microphone') })
    } finally {
      publish({ actionBusy: false })
    }
  }, [microphoneDeviceId, observeTrack, preferredDeafened, preferredMicrophoneMuted, publish, rememberDeafened, rememberMuted, reportCallPresence, session, setTrack])

  const toggleDeafen = useCallback(async () => {
    if (!activeChannel.current || !session) {
      const nextDeafened = !preferredDeafened
      rememberDeafened(nextDeafened)
      if (nextDeafened) rememberMuted(true)
      if (activeChannel.current) publish({ deafened: nextDeafened, microphoneMuted: nextDeafened ? true : preferredMicrophoneMuted })
      return
    }
    const nextDeafened = !session.deafened
    const audio = participants.current.get(LOCAL_PARTICIPANT)?.audioTrack
    publish({ actionBusy: true })
    try {
      if (nextDeafened && audio && !audio.isMuted()) {
        await audio.mute()
        setTrack(audio)
        rememberMuted(true)
      }
      rememberDeafened(nextDeafened)
      publish({ deafened: nextDeafened, error: '' })
      void reportCallPresence('update')
    } catch (caught) {
      publish({ error: errorMessage(caught) })
    } finally {
      publish({ actionBusy: false })
    }
  }, [preferredDeafened, preferredMicrophoneMuted, publish, rememberDeafened, rememberMuted, reportCallPresence, session, setTrack])

  const toggleVideoKind = useCallback(async (kind: 'video' | 'desktop') => {
    const conference = resources.current.conference
    const local = participants.current.get(LOCAL_PARTICIPANT)
    if (!conference || !local) return
    if (!session?.canStreamVideo) {
      publish({ error: 'You do not have permission to share video in this voice channel.' })
      return
    }
    const existing = kind === 'desktop' ? local.screenTrack : local.videoTrack
    publish({ actionBusy: true })
    try {
      if (existing) {
        await conference.removeTrack(existing)
        setTrack(existing, true)
        resources.current.localTracks = resources.current.localTracks.filter((track) => track !== existing)
        await existing.dispose()
      } else {
        const jitsi = await loadJitsi()
        const tracks = await jitsi.createLocalTracks({
          devices: [kind],
          ...(kind === 'video' ? { resolution: '720' } : {}),
          ...(kind === 'video' && cameraDeviceId ? { cameraDeviceId } : {}),
        })
        for (const track of tracks) {
          resources.current.localTracks.push(track)
          try {
            observeTrack(track, kind)
            await conference.addTrack(track)
          } catch (caught) {
            setTrack(track, true)
            resources.current.localTracks = resources.current.localTracks.filter((item) => item !== track)
            await track.dispose().catch(() => undefined)
            throw caught
          }
        }
      }
      publish({ error: '' })
      void reportCallPresence('update')
    } catch (caught) {
      publish({ error: mediaErrorMessage(caught, kind === 'desktop' ? 'screen' : 'camera') })
    } finally {
      publish({ actionBusy: false })
    }
  }, [cameraDeviceId, observeTrack, publish, reportCallPresence, session?.canStreamVideo, setTrack])

  const toggleCamera = useCallback(async () => toggleVideoKind('video'), [toggleVideoKind])
  const toggleScreenShare = useCallback(async () => {
    const existing = participants.current.get(LOCAL_PARTICIPANT)?.screenTrack
    if (existing || !window.desktop) {
      await toggleVideoKind('desktop')
      return
    }
    if (!session?.canStreamVideo) {
      publish({ error: 'You do not have permission to share video in this voice channel.' })
      return
    }
    publish({ actionBusy: true, error: '' })
    setScreenPickerError('')
    try {
      const sources = await window.desktop.getDisplaySources()
      if (!sources.length) throw new Error('No windows or displays are available to share.')
      setScreenSources(sources)
    } catch (caught) {
      publish({ error: mediaErrorMessage(caught, 'screen') })
    } finally {
      publish({ actionBusy: false })
    }
  }, [publish, session?.canStreamVideo, toggleVideoKind])

  const selectScreenSource = useCallback(async (sourceId: string) => {
    if (!window.desktop) return
    setScreenPickerError('')
    publish({ actionBusy: true })
    try {
      await window.desktop.selectDisplaySource(sourceId)
      setScreenSources([])
      await toggleVideoKind('desktop')
    } catch (caught) {
      setScreenPickerError(mediaErrorMessage(caught, 'screen'))
      await window.desktop.selectDisplaySource(null).catch(() => undefined)
    } finally {
      publish({ actionBusy: false })
    }
  }, [publish, toggleVideoKind])

  const closeScreenPicker = useCallback(() => {
    setScreenSources([])
    setScreenPickerError('')
    void window.desktop?.selectDisplaySource(null)
  }, [])

  const selectMicrophone = useCallback(async (deviceId: string) => {
    setMicrophoneDeviceId(deviceId)
    localStorage.setItem('thiscord_microphone', deviceId)
    const conference = resources.current.conference
    const existing = participants.current.get(LOCAL_PARTICIPANT)?.audioTrack
    if (!conference || !existing) return
    publish({ actionBusy: true })
    try {
      const jitsi = await loadJitsi()
      const tracks = await jitsi.createLocalTracks({
        devices: ['audio'],
        ...(deviceId ? { micDeviceId: deviceId } : {}),
      })
      const replacement = tracks.find((track) => track.getType() === 'audio')
      if (!replacement) throw new Error('The selected microphone could not be opened.')
      if (existing.isMuted()) await replacement.mute()
      await conference.removeTrack(existing)
      setTrack(existing, true)
      resources.current.localTracks = resources.current.localTracks.filter((track) => track !== existing)
      await existing.dispose()
      resources.current.localTracks.push(replacement)
      observeTrack(replacement)
      await conference.addTrack(replacement)
      publish({ error: '' })
      void refreshDevices()
      void reportCallPresence('update')
    } catch (caught) {
      publish({ error: mediaErrorMessage(caught, 'microphone') })
    } finally {
      publish({ actionBusy: false })
    }
  }, [observeTrack, publish, refreshDevices, reportCallPresence, setTrack])

  const selectCamera = useCallback(async (deviceId: string) => {
    setCameraDeviceId(deviceId)
    localStorage.setItem('thiscord_camera', deviceId)
    const conference = resources.current.conference
    const existing = participants.current.get(LOCAL_PARTICIPANT)?.videoTrack
    if (!conference || !existing) return
    publish({ actionBusy: true })
    try {
      const jitsi = await loadJitsi()
      const tracks = await jitsi.createLocalTracks({
        devices: ['video'],
        resolution: '720',
        ...(deviceId ? { cameraDeviceId: deviceId } : {}),
      })
      const replacement = tracks.find((track) => track.getType() === 'video')
      if (!replacement) throw new Error('The selected camera could not be opened.')
      await conference.removeTrack(existing)
      setTrack(existing, true)
      resources.current.localTracks = resources.current.localTracks.filter((track) => track !== existing)
      await existing.dispose()
      resources.current.localTracks.push(replacement)
      observeTrack(replacement)
      await conference.addTrack(replacement)
      publish({ error: '' })
      void refreshDevices()
      void reportCallPresence('update')
    } catch (caught) {
      publish({ error: mediaErrorMessage(caught, 'camera') })
    } finally {
      publish({ actionBusy: false })
    }
  }, [observeTrack, publish, refreshDevices, reportCallPresence, setTrack])

  const selectSpeaker = useCallback(async (deviceId: string) => {
    try {
      const probe = document.createElement('audio') as HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> }
      if (deviceId && !probe.setSinkId) throw new Error('Speaker selection is not supported by this browser.')
      if (deviceId) await probe.setSinkId?.(deviceId)
      setSpeakerDeviceId(deviceId)
      localStorage.setItem('thiscord_speaker', deviceId)
      publish({ error: '' })
    } catch (caught) {
      publish({ error: `Could not select that speaker: ${errorMessage(caught)}` })
    }
  }, [publish])

  const moderateParticipant = useCallback(async (participantId: string, action: 'mute' | 'kick') => {
    const conference = resources.current.conference
    if (!conference || !session?.moderator) return
    try {
      if (action === 'kick') {
        if (!session.canRemoveMembers) throw new Error('You do not have permission to remove members from this call.')
        conference.kickParticipant(participantId)
      } else {
        if (!session.canMuteMembers) throw new Error('You do not have permission to mute members in this call.')
        conference.muteParticipant(participantId, 'audio')
      }
      publish({ error: '' })
    } catch (caught) {
      publish({ error: errorMessage(caught) })
    }
  }, [publish, session])

  useEffect(() => {
    const onDeviceChange = () => void refreshDevices()
    navigator.mediaDevices?.addEventListener?.('devicechange', onDeviceChange)
    return () => navigator.mediaDevices?.removeEventListener?.('devicechange', onDeviceChange)
  }, [refreshDevices])

  useEffect(() => () => {
    generation.current += 1
    void releaseResources()
  }, [releaseResources])

  const value = useMemo<CallContextValue>(() => ({
    session,
    microphoneMuted: session?.microphoneMuted ?? preferredMicrophoneMuted,
    deafened: session?.deafened ?? preferredDeafened,
    join,
    leave,
    retry,
    toggleMicrophone,
    toggleDeafen,
    toggleCamera,
    toggleScreenShare,
    devices,
    microphoneDeviceId,
    cameraDeviceId,
    speakerDeviceId,
    refreshDevices,
    selectMicrophone,
    selectCamera,
    selectSpeaker,
    prioritizeVideo,
    moderateParticipant,
  }), [cameraDeviceId, devices, join, leave, microphoneDeviceId, moderateParticipant, preferredDeafened, preferredMicrophoneMuted, prioritizeVideo, refreshDevices, retry, selectCamera, selectMicrophone, selectSpeaker, session, speakerDeviceId, toggleCamera, toggleDeafen, toggleMicrophone, toggleScreenShare])

  return (
    <CallContext.Provider value={value}>
      {children}
      {screenSources.length ? (
        <div className="modal-backdrop screen-picker-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.currentTarget === event.target) closeScreenPicker()
        }}>
          <section className="screen-source-picker" role="dialog" aria-modal="true" aria-labelledby="screen-source-title">
            <header>
              <span><h2 id="screen-source-title">Share your screen</h2><p>Choose a display or window.</p></span>
              <button type="button" onClick={closeScreenPicker}>Cancel</button>
            </header>
            <div className="screen-source-grid">
              {screenSources.map((source) => (
                <button type="button" onClick={() => void selectScreenSource(source.id)} key={source.id}>
                  <img src={source.thumbnailUrl} alt="" />
                  <span>{source.appIconUrl ? <img src={source.appIconUrl} alt="" /> : null}<strong>{source.name}</strong></span>
                </button>
              ))}
            </div>
            {screenPickerError ? <p className="form-error" role="alert">{screenPickerError}</p> : null}
          </section>
        </div>
      ) : null}
    </CallContext.Provider>
  )
}

export function useCall() {
  const value = useContext(CallContext)
  if (!value) throw new Error('CallProvider is missing.')
  return value
}
