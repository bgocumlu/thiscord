/* eslint-disable react-refresh/only-export-components, react-hooks/preserve-manual-memoization, react-hooks/refs */
import type {
  CallTargetDescriptor,
  User,
} from '@thiscord/shared'
import { transientTimings } from '@thiscord/shared'
import type { JitsiTrack } from 'lib-jitsi-meet'
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
import { usePocketBase } from '../../lib/contexts'
import { errorMessage } from '../../lib/pocketbase'
import { callAccessWasRevoked, callApi } from './api'
import { startConferenceLifecycle } from './conferenceLifecycle'
import { recoverJoinFailure } from './joinFailure'
import { callKeys } from './queryKeys'
import { sameCallTarget } from './targets'
import {
  LOCAL_PARTICIPANT,
  participantFromJitsi,
  synchronizeParticipantTrack,
} from './participantSync'
import type {
  CallContextValue,
  CallSession,
  MutableParticipant,
} from './types'
import { createPresenceHeartbeat } from './presenceHeartbeat'
import { createRecoveryCoordinator } from './recoveryCoordinator'
import {
  enforceLocalMediaRejection,
  localVideoKind,
  rejectedLocalMedia,
  type RejectedMediaType,
} from './localMediaPolicy'
import { createLocalMediaRuntime } from './localMediaRuntime'
import { attachLocalMediaAfterJoin } from './localTrackLifecycle'
import { ScreenSourceDialog } from './ScreenSourceDialog'
import { useLocalMediaControls } from './useLocalMediaControls'
import { useMediaPreferences } from './useMediaPreferences'
import {
  disposeRetainedMedia,
  releaseEngineResources,
} from './resourceLifecycle'
import {
  createEngineResources,
  currentJitsiApi,
  loadJitsiEngine,
  markJitsiModuleFresh,
  type JitsiEngineResources,
} from './jitsiEngine'

const CallContext = createContext<CallContextValue | null>(null)

export function CallProvider({ user, children }: {
  readonly user: User
  readonly children: ReactNode
}) {
  const client = usePocketBase()
  const queryClient = useQueryClient()
  const resources = useRef<JitsiEngineResources>(createEngineResources())
  const participants = useRef(new Map<string, MutableParticipant>())
  const generation = useRef(0)
  const activeTarget = useRef<CallTargetDescriptor | null>(null)
  const joinRef = useRef<(target: CallTargetDescriptor, automatic?: boolean) => Promise<void>>(async () => undefined)
  const leaveRef = useRef<() => Promise<void>>(async () => undefined)
  const reportCallPresenceRef = useRef<(state: 'joined' | 'update' | 'left') => Promise<void>>(async () => undefined)
  const mediaPolicyRejectedRef = useRef<(mediaType: RejectedMediaType) => Promise<void>>(async () => undefined)
  const stopScreenAudioRef = useRef<() => Promise<void>>(async () => undefined)
  const recoveryRetryRef = useRef<() => void>(() => undefined)
  const terminalFailureRef = useRef<(message: string) => Promise<void>>(async () => undefined)
  const terminalCleanup = useRef<Promise<void> | null>(null)
  const observedTracks = useRef(new WeakSet<JitsiTrack>())
  const localVideoKinds = useRef(new WeakMap<JitsiTrack, 'video' | 'desktop'>())
  const {
    preferredMicrophoneMuted,
    preferredDeafened,
    microphoneMutedRef,
    deafenedRef,
    rememberMuted,
    rememberDeafened,
  } = useMediaPreferences()
  const getEngineResources = useCallback(() => resources.current, [])
  const getParticipants = useCallback(() => participants.current, [])
  const mediaRuntime = useMemo(
    () => createLocalMediaRuntime(getEngineResources, getParticipants),
    [getEngineResources, getParticipants],
  )
  const hasActiveTarget = useCallback(() => Boolean(activeTarget.current), [])
  const registerStopScreenAudio = useCallback((stop: () => Promise<void>) => {
    stopScreenAudioRef.current = stop
  }, [])
  const [session, setSession] = useState<CallSession | null>(null)
  const presenceHeartbeat = useMemo(
    () => createPresenceHeartbeat(transientTimings.callHeartbeatMs, {
      setInterval: (callback, delayMs) => window.setInterval(callback, delayMs),
      clearInterval: (id) => window.clearInterval(id),
    }),
    [],
  )

  const publish = useCallback((patch?: Partial<CallSession>) => {
    const target = activeTarget.current
    if (!target) {
      setSession(null)
      return
    }
    const localParticipant = participants.current.get(LOCAL_PARTICIPANT)
    setSession((current) => ({
      target,
      status: current?.status ?? 'connecting',
      error: current?.error ?? '',
      microphoneMuted: current?.microphoneMuted ?? microphoneMutedRef.current,
      deafened: current?.deafened ?? deafenedRef.current,
      actionBusy: current?.actionBusy ?? false,
      canSpeak: current?.canSpeak ?? false,
      canStreamVideo: current?.canStreamVideo ?? false,
      canMuteMembers: current?.canMuteMembers ?? false,
      canRemoveMembers: current?.canRemoveMembers ?? false,
      participants: [...participants.current.values()].map((participant) => ({ ...participant })),
      ...patch,
      cameraEnabled: Boolean(localParticipant?.videoTrack),
      screenSharing: Boolean(localParticipant?.screenTrack),
    }))
  }, [deafenedRef, microphoneMutedRef])
  const recovery = useMemo(() => createRecoveryCoordinator({
    scheduler: {
      setTimeout: (callback, delayMs) => window.setTimeout(callback, delayMs),
      clearTimeout: (id) => window.clearTimeout(id),
    },
    onScheduled: (message) => publish({ status: 'reconnecting', error: message }),
    onRetry: () => recoveryRetryRef.current(),
    onExhausted: () => {
      void terminalFailureRef.current(
        'Couldn’t recover the media connection. Check the network or media server, then retry.',
      )
    },
  }), [publish])

  const setTrack = useCallback((track: JitsiTrack, remove = false, localVideoKind?: 'video' | 'desktop') => {
    synchronizeParticipantTrack(participants.current, track, {
      remove,
      localVideoKind,
      localVideoKinds: localVideoKinds.current,
    })
    publish({
      microphoneMuted: participants.current.get(LOCAL_PARTICIPANT)?.audioTrack?.isMuted() ?? true,
    })
  }, [publish])

  const observeTrack = useCallback((track: JitsiTrack, localVideoKind?: 'video' | 'desktop') => {
    const events = currentJitsiApi()?.events.track
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
        if (localVideoKind === 'desktop') void stopScreenAudioRef.current()
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

  const reportCallPresence = useCallback(async (state: 'joined' | 'update' | 'left') => {
    const target = activeTarget.current
    if (!target) return
    const local = participants.current.get(LOCAL_PARTICIPANT)
    const result = await callApi.reportPresence(client, target.target, {
      state,
      muted: local?.audioTrack?.isMuted() ?? true,
      deafened: deafenedRef.current,
      camera: Boolean(local?.videoTrack),
      sharing: Boolean(local?.screenTrack),
    })
    if (state !== 'left' && activeTarget.current && sameCallTarget(activeTarget.current.target, target.target)) {
      publish({
        canSpeak: result.canSpeak ?? false,
        canStreamVideo: result.canStreamVideo ?? false,
        canMuteMembers: result.canMuteMembers ?? false,
        canRemoveMembers: result.canRemoveMembers ?? false,
      })
      const refreshedAccess = {
        canSpeak: result.canSpeak ?? false,
        canStreamVideo: result.canStreamVideo ?? false,
      }
      for (const mediaType of rejectedLocalMedia(local, refreshedAccess)) {
        if (!rejectedLocalMedia(
          participants.current.get(LOCAL_PARTICIPANT),
          refreshedAccess,
        ).includes(mediaType)) continue
        await mediaPolicyRejectedRef.current(mediaType)
      }
    }
    await queryClient.invalidateQueries({ queryKey: callKeys.all })
  }, [client, deafenedRef, publish, queryClient])
  useEffect(() => {
    reportCallPresenceRef.current = reportCallPresence
  }, [reportCallPresence])
  const handlePresenceFailure = useCallback((error: unknown) => {
    if (callAccessWasRevoked(error)) void leaveRef.current()
  }, [])
  const {
    screenSources,
    screenPickerError,
    devices,
    microphoneDeviceId,
    cameraDeviceId,
    speakerDeviceId,
    refreshDevices,
    clearScreenPicker,
    closeScreenPicker,
    selectScreenSource,
    toggleMicrophone,
    toggleDeafen,
    toggleCamera,
    toggleScreenShare,
    selectMicrophone,
    selectCamera,
    selectSpeaker,
  } = useLocalMediaControls({
    runtime: mediaRuntime,
    hasActiveTarget,
    session,
    preferredMicrophoneMuted,
    preferredDeafened,
    rememberMuted,
    rememberDeafened,
    publish,
    setTrack,
    observeTrack,
    reportPresence: reportCallPresence,
    registerStopScreenAudio,
  })

  const handleMediaPolicyRejected = useCallback(async (mediaType: RejectedMediaType) => {
    publish(mediaType === 'audio'
      ? { canSpeak: false, microphoneMuted: true }
      : { canStreamVideo: false })
    try {
      await enforceLocalMediaRejection(mediaType, {
        conference: resources.current.conference,
        participant: participants.current.get(LOCAL_PARTICIPANT),
        removeTrack: mediaRuntime.removeTrack,
        synchronizeTrack: setTrack,
        stopScreenAudio: () => stopScreenAudioRef.current(),
      })
      publish()
      await reportCallPresence('update').catch(handlePresenceFailure)
    } catch {
      // A client that cannot drop revoked media must fail closed.
      await leaveRef.current()
    }
  }, [handlePresenceFailure, mediaRuntime.removeTrack, publish, reportCallPresence, setTrack])
  useEffect(() => {
    mediaPolicyRejectedRef.current = handleMediaPolicyRejected
  }, [handleMediaPolicyRejected])

  const releaseResources = useCallback(async ({
    preserveLocalTracks = false,
    announceDeparture = true,
  }: {
    readonly preserveLocalTracks?: boolean
    readonly announceDeparture?: boolean
  } = {}) => {
    recovery.cancel()
    await presenceHeartbeat.stop()
    if (activeTarget.current && announceDeparture) {
      try {
        await reportCallPresence('left')
      } catch {
        // Expiry cleanup removes a stale participant if the final request cannot be delivered.
      }
    }
    const current = resources.current
    resources.current = createEngineResources()
    const { retained: retainedMedia } = await releaseEngineResources(
      current,
      preserveLocalTracks,
    )
    participants.current.clear()
    return preserveLocalTracks ? retainedMedia : { localTracks: [], screenAudio: null }
  }, [presenceHeartbeat, recovery, reportCallPresence])

  const failTerminally = useCallback((message: string) => {
    if (terminalCleanup.current) return terminalCleanup.current
    generation.current += 1
    clearScreenPicker()
    publish({ status: 'error', error: message, actionBusy: false })
    const cleanup = releaseResources()
      .then(() => publish({ status: 'error', error: message, actionBusy: false }))
      .finally(() => {
        if (terminalCleanup.current === cleanup) terminalCleanup.current = null
      })
    terminalCleanup.current = cleanup
    return cleanup
  }, [clearScreenPicker, publish, releaseResources])
  useEffect(() => {
    terminalFailureRef.current = failTerminally
  }, [failTerminally])

  const leave = useCallback(async () => {
    await terminalCleanup.current
    generation.current += 1
    recovery.reset()
    clearScreenPicker()
    await releaseResources()
    activeTarget.current = null
    setSession(null)
  }, [clearScreenPicker, recovery, releaseResources])
  useEffect(() => {
    leaveRef.current = leave
  }, [leave])

  const join = useCallback(async (target: CallTargetDescriptor, automatic = false) => {
    await terminalCleanup.current
    if (
      activeTarget.current && sameCallTarget(activeTarget.current.target, target.target)
      && !automatic
      && session?.status !== 'error'
    ) return

    if (!automatic) recovery.reset()
    const requestGeneration = generation.current + 1
    generation.current = requestGeneration
    recoveryRetryRef.current = () => {
      if (
        generation.current === requestGeneration
        && activeTarget.current
        && sameCallTarget(activeTarget.current.target, target.target)
      ) {
        void joinRef.current(target, true)
      }
    }
    const retainedMedia = await releaseResources({
      preserveLocalTracks: automatic,
      announceDeparture: !automatic,
    })
    if (generation.current !== requestGeneration) {
      await disposeRetainedMedia(retainedMedia)
      return
    }

    activeTarget.current = target
    rememberDeafened(preferredDeafened)
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
    resources.current.localTracks.push(...retainedMedia.localTracks)
    resources.current.screenAudio = retainedMedia.screenAudio
    for (const track of retainedMedia.localTracks) {
      const retainedKind = track.getType() === 'video'
        ? localVideoKind(track, localVideoKinds.current.get(track))
        : undefined
      observeTrack(track, retainedKind)
    }
    publish({
      status: automatic ? 'reconnecting' : 'connecting',
      error: '',
      actionBusy: false,
      canSpeak: false,
      canStreamVideo: false,
      canMuteMembers: false,
      canRemoveMembers: false,
      microphoneMuted: preferredMicrophoneMuted || preferredDeafened,
      deafened: preferredDeafened,
    })

    try {
      const jitsi = await loadJitsiEngine()
      markJitsiModuleFresh()
      const info = await callApi.join(client, target.target)
      if (generation.current !== requestGeneration) return
      publish({
        canSpeak: info.canSpeak,
        canStreamVideo: info.canStreamVideo,
        canMuteMembers: info.canMuteMembers,
        canRemoveMembers: info.canRemoveMembers,
      })

      const recover = (reason: string) => {
        if (generation.current !== requestGeneration || recovery.scheduled()) return
        recovery.recover(reason)
      }
      const current = () => generation.current === requestGeneration
      resources.current.connection = startConferenceLifecycle(jitsi, info, {
        current,
        recover,
        onConferenceCreated: (conference) => {
          resources.current.conference = conference
          for (const remote of conference.getParticipants()) {
            participants.current.set(remote.getId(), participantFromJitsi(remote))
          }
        },
        onConferenceStarted: (conference) => {
          void attachLocalMediaAfterJoin({
            jitsi,
            conference,
            info,
            resources: resources.current,
            localVideoKinds: localVideoKinds.current,
            microphoneDeviceId,
            microphoneMuted: preferredMicrophoneMuted,
            deafened: preferredDeafened,
            current,
            observeTrack,
            setTrack,
            stopScreenAudio: () => stopScreenAudioRef.current(),
            refreshDevices,
          })
        },
        onParticipantJoined: (remote) => {
          const fresh = participantFromJitsi(remote)
          const existing = participants.current.get(remote.getId())
          participants.current.set(remote.getId(), {
            ...fresh,
            ...existing,
            userId: fresh.userId || existing?.userId || '',
            name: remote.getDisplayName() || existing?.name || 'Participant',
          })
          publish()
        },
        onParticipantLeft: (participantId) => {
          participants.current.delete(participantId)
          publish()
        },
        onDisplayNameChanged: (participantId, name) => {
          const participant = participants.current.get(participantId)
          if (participant) {
            participant.name = name
            publish()
          }
        },
        onTrackAdded: observeTrack,
        onTrackRemoved: (track) => setTrack(track, true),
        onMediaPolicyApproved: (mediaType) => {
          publish(mediaType === 'audio'
            ? { canSpeak: true }
            : { canStreamVideo: true })
        },
        onMediaPolicyRejected: handleMediaPolicyRejected,
        onJoined: (conference) => {
          recovery.reset()
          conference.setReceiverConstraints({
            lastN: 25,
            defaultConstraints: { maxHeight: 720 },
            constraints: {},
          })
          publish({ status: 'connected', error: '' })
          presenceHeartbeat.start(
            () => reportCallPresence('update'),
            handlePresenceFailure,
            true,
            () => reportCallPresence('joined'),
          )
        },
        onRejected: () => {
          void terminalFailureRef.current(
            'The media server rejected this call session. Retry the connection.',
          )
        },
        onKicked: () => {
          void leaveRef.current()
        },
        onInterrupted: () => publish({ status: 'reconnecting' }),
        onRestored: () => publish({ status: 'connected', error: '' }),
      })
    } catch (caught) {
      if (generation.current === requestGeneration) {
        if (await recoverJoinFailure(caught, target.target, leaveRef.current)) return
        await terminalFailureRef.current(errorMessage(caught))
      }
    }
  }, [client, handleMediaPolicyRejected, handlePresenceFailure, microphoneDeviceId, observeTrack, preferredDeafened, preferredMicrophoneMuted, presenceHeartbeat, publish, recovery, refreshDevices, releaseResources, rememberDeafened, reportCallPresence, session, setTrack, user.displayName, user.id])

  useEffect(() => {
    joinRef.current = join
  }, [join])

  const retry = useCallback(async () => {
    if (activeTarget.current) await join(activeTarget.current)
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

  const moderateParticipant = useCallback(async (userId: string, action: 'mute' | 'kick') => {
    if (!session) return
    try {
      if (action === 'kick') {
        if (!session.canRemoveMembers) throw new Error('You do not have permission to remove members from this call.')
      } else {
        if (!session.canMuteMembers) throw new Error('You do not have permission to mute members in this call.')
      }
      await callApi.moderate(client, session.target.target, userId, action)
      publish({ error: '' })
    } catch (caught) {
      publish({ error: errorMessage(caught) })
    }
  }, [client, publish, session])

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
        <ScreenSourceDialog
          sources={screenSources}
          error={screenPickerError}
          onClose={closeScreenPicker}
          onSelect={(sourceId, shareSystemAudio) => {
            void selectScreenSource(sourceId, shareSystemAudio)
          }}
        />
      ) : null}
    </CallContext.Provider>
  )
}

export function useCall() {
  const value = useContext(CallContext)
  if (!value) throw new Error('CallProvider is missing.')
  return value
}
