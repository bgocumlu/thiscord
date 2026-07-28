import type { DesktopCaptureSource } from '@thiscord/shared'
import type { JitsiTrack } from 'lib-jitsi-meet'
import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import { errorMessage } from '../../lib/pocketbase'
import { ScreenAudioMixerEffect } from './ScreenAudioMixerEffect'
import {
  loadJitsiEngine,
  mediaErrorMessage,
} from './jitsiEngine'
import {
  discardLocalTrack,
  replacePublishedLocalTrack,
} from './localMediaPolicy'
import type { LocalMediaRuntime } from './localMediaRuntime'
import { setAudioOutputDevice } from './speakerOutput'
import type { CallSession } from './types'

type PublishSession = (patch?: Partial<CallSession>) => void
type SyncTrack = (
  track: JitsiTrack,
  remove?: boolean,
  localVideoKind?: 'video' | 'desktop',
) => void
type ObserveTrack = (track: JitsiTrack, localVideoKind?: 'video' | 'desktop') => void

export function useLocalMediaControls({
  runtime,
  hasActiveTarget,
  session,
  preferredMicrophoneMuted,
  preferredDeafened,
  rememberMuted,
  rememberDeafened,
  publish,
  setTrack,
  observeTrack,
  reportPresence,
  registerStopScreenAudio,
}: {
  readonly runtime: LocalMediaRuntime
  readonly hasActiveTarget: () => boolean
  readonly session: CallSession | null
  readonly preferredMicrophoneMuted: boolean
  readonly preferredDeafened: boolean
  readonly rememberMuted: (muted: boolean) => void
  readonly rememberDeafened: (deafened: boolean) => void
  readonly publish: PublishSession
  readonly setTrack: SyncTrack
  readonly observeTrack: ObserveTrack
  readonly reportPresence: (state: 'joined' | 'update' | 'left') => Promise<void>
  readonly registerStopScreenAudio: (stop: () => Promise<void>) => void
}) {
  const [screenSources, setScreenSources] = useState<readonly DesktopCaptureSource[]>([])
  const [screenPickerError, setScreenPickerError] = useState('')
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [microphoneDeviceId, setMicrophoneDeviceId] = useState(
    () => localStorage.getItem('thiscord_microphone') ?? '',
  )
  const [cameraDeviceId, setCameraDeviceId] = useState(
    () => localStorage.getItem('thiscord_camera') ?? '',
  )
  const [speakerDeviceId, setSpeakerDeviceId] = useState(
    () => localStorage.getItem('thiscord_speaker') ?? '',
  )

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      setDevices([])
      return
    }
    setDevices(await navigator.mediaDevices.enumerateDevices())
  }, [])

  const clearScreenPicker = useCallback(() => {
    setScreenSources([])
    setScreenPickerError('')
  }, [])

  const toggleMicrophone = useCallback(async () => {
    const conference = runtime.conference
    if (!conference || !hasActiveTarget() || !session) {
      const nextMuted = !preferredMicrophoneMuted
      rememberMuted(nextMuted)
      if (!nextMuted && preferredDeafened) rememberDeafened(false)
      if (hasActiveTarget()) {
        publish({
          microphoneMuted: nextMuted,
          deafened: nextMuted ? preferredDeafened : false,
        })
      }
      return
    }
    if (!session.canSpeak) {
      publish({ error: 'You do not have permission to speak in this call.' })
      return
    }
    const audio = runtime.localParticipant()?.audioTrack
    const createdTracks: JitsiTrack[] = []
    publish({ actionBusy: true })
    try {
      if (audio) {
        if (audio.isMuted()) await audio.unmute()
        else await audio.mute()
        setTrack(audio)
        rememberMuted(audio.isMuted())
      } else {
        const jitsi = await loadJitsiEngine()
        const tracks = await jitsi.createLocalTracks({
          devices: ['audio'],
          ...(microphoneDeviceId ? { micDeviceId: microphoneDeviceId } : {}),
        })
        createdTracks.push(...tracks)
        for (const track of tracks) {
          runtime.addTrack(track)
          observeTrack(track)
          await conference.addTrack(track)
        }
        rememberMuted(false)
      }
      publish({ deafened: false, error: '' })
      rememberDeafened(false)
      void reportPresence('update')
    } catch (caught) {
      for (const track of createdTracks) {
        await discardLocalTrack(track, {
          conference,
          removeTrack: runtime.removeTrack,
          synchronizeTrack: setTrack,
        })
      }
      publish({ error: mediaErrorMessage(caught, 'microphone') })
    } finally {
      publish({ actionBusy: false })
    }
  }, [
    hasActiveTarget,
    microphoneDeviceId,
    observeTrack,
    preferredDeafened,
    preferredMicrophoneMuted,
    publish,
    rememberDeafened,
    rememberMuted,
    reportPresence,
    runtime,
    session,
    setTrack,
  ])

  const toggleDeafen = useCallback(async () => {
    if (!hasActiveTarget() || !session) {
      const nextDeafened = !preferredDeafened
      rememberDeafened(nextDeafened)
      if (nextDeafened) rememberMuted(true)
      if (hasActiveTarget()) {
        publish({
          deafened: nextDeafened,
          microphoneMuted: nextDeafened ? true : preferredMicrophoneMuted,
        })
      }
      return
    }
    const nextDeafened = !session.deafened
    const audio = runtime.localParticipant()?.audioTrack
    publish({ actionBusy: true })
    try {
      if (nextDeafened && audio && !audio.isMuted()) {
        await audio.mute()
        setTrack(audio)
        rememberMuted(true)
      }
      rememberDeafened(nextDeafened)
      publish({ deafened: nextDeafened, error: '' })
      void reportPresence('update')
    } catch (caught) {
      publish({ error: errorMessage(caught) })
    } finally {
      publish({ actionBusy: false })
    }
  }, [
    hasActiveTarget,
    preferredDeafened,
    preferredMicrophoneMuted,
    publish,
    rememberDeafened,
    rememberMuted,
    reportPresence,
    runtime,
    session,
    setTrack,
  ])

  const stopScreenAudioMix = useCallback(async () => {
    const screenAudio = runtime.screenAudio
    if (!screenAudio) return
    runtime.setScreenAudio(null)
    try {
      await screenAudio.microphoneTrack.setEffect(undefined)
      if (runtime.hasTrack(screenAudio.microphoneTrack)) {
        setTrack(screenAudio.microphoneTrack)
      }
    } catch {
      // The conference or microphone may already be disposed during teardown.
    }
    await screenAudio.capturedTrack.dispose().catch(() => undefined)
  }, [runtime, setTrack])

  useEffect(() => {
    registerStopScreenAudio(stopScreenAudioMix)
  }, [registerStopScreenAudio, stopScreenAudioMix])

  const toggleVideoKind = useCallback(async (kind: 'video' | 'desktop') => {
    const conference = runtime.conference
    const local = runtime.localParticipant()
    if (!conference || !local) return
    if (!session?.canStreamVideo) {
      publish({ error: 'You do not have permission to share video in this call.' })
      return
    }
    const existing = kind === 'desktop' ? local.screenTrack : local.videoTrack
    publish({ actionBusy: true })
    try {
      if (existing) {
        await conference.removeTrack(existing)
        setTrack(existing, true)
        runtime.removeTrack(existing)
        await existing.dispose()
        if (kind === 'desktop') await stopScreenAudioMix()
      } else {
        const jitsi = await loadJitsiEngine()
        const tracks = await jitsi.createLocalTracks({
          devices: [kind],
          ...(kind === 'video' ? { resolution: '720' } : {}),
          ...(kind === 'video' && cameraDeviceId ? { cameraDeviceId } : {}),
        })
        const capturedScreenAudio = kind === 'desktop'
          ? tracks.find((track) => track.getType() === 'audio') ?? null
          : null
        let screenAudioAttached = false
        try {
          if (capturedScreenAudio) {
            if (local.audioTrack) {
              await local.audioTrack.setEffect(new ScreenAudioMixerEffect(jitsi, capturedScreenAudio))
              runtime.setScreenAudio({
                capturedTrack: capturedScreenAudio,
                microphoneTrack: local.audioTrack,
              })
              capturedScreenAudio.getTrack().addEventListener('ended', () => {
                void stopScreenAudioMix()
              }, { once: true })
              setTrack(local.audioTrack)
              screenAudioAttached = true
            } else {
              await capturedScreenAudio.dispose()
            }
          }
          const publishableTracks = kind === 'desktop'
            ? tracks.filter((track) => track.getType() === 'video')
            : tracks
          if (kind === 'desktop' && !publishableTracks.length) {
            throw new Error('The browser did not provide a screen video track.')
          }
          for (const track of publishableTracks) {
            runtime.addTrack(track)
            try {
              observeTrack(track, kind)
              await conference.addTrack(track)
            } catch (caught) {
              setTrack(track, true)
              runtime.removeTrack(track)
              await track.dispose().catch(() => undefined)
              throw caught
            }
          }
        } catch (caught) {
          if (screenAudioAttached) await stopScreenAudioMix()
          else await capturedScreenAudio?.dispose().catch(() => undefined)
          for (const track of tracks) {
            if (track !== capturedScreenAudio && !runtime.hasTrack(track)) {
              await track.dispose().catch(() => undefined)
            }
          }
          throw caught
        }
        for (const extraAudioTrack of tracks.filter((track) => (
          track.getType() === 'audio' && track !== capturedScreenAudio
        ))) {
          await extraAudioTrack.dispose().catch(() => undefined)
        }
      }
      publish({ error: '' })
      void reportPresence('update')
    } catch (caught) {
      publish({ error: mediaErrorMessage(caught, kind === 'desktop' ? 'screen' : 'camera') })
    } finally {
      publish({ actionBusy: false })
    }
  }, [
    cameraDeviceId,
    observeTrack,
    publish,
    reportPresence,
    runtime,
    session?.canStreamVideo,
    setTrack,
    stopScreenAudioMix,
  ])

  const toggleCamera = useCallback(
    async () => toggleVideoKind('video'),
    [toggleVideoKind],
  )

  const toggleScreenShare = useCallback(async () => {
    const existing = runtime.localParticipant()?.screenTrack
    if (existing || !window.desktop) {
      await toggleVideoKind('desktop')
      return
    }
    if (!session?.canStreamVideo) {
      publish({ error: 'You do not have permission to share video in this call.' })
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
  }, [publish, runtime, session?.canStreamVideo, toggleVideoKind])

  const selectScreenSource = useCallback(async (
    sourceId: string,
    shareSystemAudio: boolean,
  ) => {
    if (!window.desktop) return
    setScreenPickerError('')
    publish({ actionBusy: true })
    try {
      await window.desktop.selectDisplaySource(sourceId, shareSystemAudio)
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
    clearScreenPicker()
    void window.desktop?.selectDisplaySource(null)
  }, [clearScreenPicker])

  const selectMicrophone = useCallback(async (deviceId: string) => {
    const previousDeviceId = microphoneDeviceId
    setMicrophoneDeviceId(deviceId)
    localStorage.setItem('thiscord_microphone', deviceId)
    const conference = runtime.conference
    const existing = runtime.localParticipant()?.audioTrack
    if (!conference || !existing) return
    publish({ actionBusy: true })
    let replacement: JitsiTrack | null = null
    let replaced = false
    try {
      const jitsi = await loadJitsiEngine()
      const tracks = await jitsi.createLocalTracks({
        devices: ['audio'],
        ...(deviceId ? { micDeviceId: deviceId } : {}),
      })
      replacement = tracks.find((track) => track.getType() === 'audio') ?? null
      if (!replacement) throw new Error('The selected microphone could not be opened.')
      if (existing.isMuted()) await replacement.mute()
      const screenAudio = runtime.screenAudio?.microphoneTrack === existing
        ? runtime.screenAudio
        : null
      if (screenAudio) {
        await replacement.setEffect(new ScreenAudioMixerEffect(jitsi, screenAudio.capturedTrack))
      }
      await replacePublishedLocalTrack(existing, replacement, {
        conference,
        addTrack: runtime.addTrack,
        removeTrack: runtime.removeTrack,
        synchronizeTrack: setTrack,
      })
      replaced = true
      if (screenAudio) {
        runtime.setScreenAudio({
          capturedTrack: screenAudio.capturedTrack,
          microphoneTrack: replacement,
        })
      }
      observeTrack(replacement)
      publish({ error: '' })
      void refreshDevices()
      void reportPresence('update')
    } catch (caught) {
      if (replacement && !replaced) {
        await discardLocalTrack(replacement, {
          conference,
          removeTrack: runtime.removeTrack,
          synchronizeTrack: setTrack,
        })
      }
      setMicrophoneDeviceId(previousDeviceId)
      localStorage.setItem('thiscord_microphone', previousDeviceId)
      publish({ error: mediaErrorMessage(caught, 'microphone') })
    } finally {
      publish({ actionBusy: false })
    }
  }, [
    observeTrack,
    microphoneDeviceId,
    publish,
    refreshDevices,
    reportPresence,
    runtime,
    setTrack,
  ])

  const selectCamera = useCallback(async (deviceId: string) => {
    const previousDeviceId = cameraDeviceId
    setCameraDeviceId(deviceId)
    localStorage.setItem('thiscord_camera', deviceId)
    const conference = runtime.conference
    const existing = runtime.localParticipant()?.videoTrack
    if (!conference || !existing) return
    publish({ actionBusy: true })
    let replacement: JitsiTrack | null = null
    let replaced = false
    try {
      const jitsi = await loadJitsiEngine()
      const tracks = await jitsi.createLocalTracks({
        devices: ['video'],
        resolution: '720',
        ...(deviceId ? { cameraDeviceId: deviceId } : {}),
      })
      replacement = tracks.find((track) => track.getType() === 'video') ?? null
      if (!replacement) throw new Error('The selected camera could not be opened.')
      await replacePublishedLocalTrack(existing, replacement, {
        conference,
        addTrack: runtime.addTrack,
        removeTrack: runtime.removeTrack,
        synchronizeTrack: setTrack,
        localVideoKind: 'video',
      })
      replaced = true
      observeTrack(replacement)
      publish({ error: '' })
      void refreshDevices()
      void reportPresence('update')
    } catch (caught) {
      if (replacement && !replaced) {
        await discardLocalTrack(replacement, {
          conference,
          removeTrack: runtime.removeTrack,
          synchronizeTrack: setTrack,
          localVideoKind: 'video',
        })
      }
      setCameraDeviceId(previousDeviceId)
      localStorage.setItem('thiscord_camera', previousDeviceId)
      publish({ error: mediaErrorMessage(caught, 'camera') })
    } finally {
      publish({ actionBusy: false })
    }
  }, [
    cameraDeviceId,
    observeTrack,
    publish,
    refreshDevices,
    reportPresence,
    runtime,
    setTrack,
  ])

  const selectSpeaker = useCallback(async (deviceId: string) => {
    try {
      const probe = document.createElement('audio') as HTMLAudioElement & {
        setSinkId?: (id: string) => Promise<void>
      }
      await setAudioOutputDevice(probe, deviceId)
      setSpeakerDeviceId(deviceId)
      localStorage.setItem('thiscord_speaker', deviceId)
      publish({ error: '' })
    } catch (caught) {
      publish({ error: `Could not select that speaker: ${errorMessage(caught)}` })
    }
  }, [publish])

  useEffect(() => {
    const onDeviceChange = () => void refreshDevices()
    navigator.mediaDevices?.addEventListener?.('devicechange', onDeviceChange)
    return () => navigator.mediaDevices?.removeEventListener?.('devicechange', onDeviceChange)
  }, [refreshDevices])

  return {
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
  }
}
