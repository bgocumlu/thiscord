import type { CallJoin } from '@thiscord/shared'
import type {
  JitsiConference,
  JitsiMeetApi,
  JitsiTrack,
} from 'lib-jitsi-meet'
import { localVideoKind, retainedTrackAllowed } from './localMediaPolicy'
import type { JitsiEngineResources } from './jitsiEngine'

export async function attachLocalMediaAfterJoin({
  jitsi,
  conference,
  info,
  resources,
  localVideoKinds,
  microphoneDeviceId,
  microphoneMuted,
  deafened,
  current,
  observeTrack,
  setTrack,
  stopScreenAudio,
  refreshDevices,
}: {
  readonly jitsi: JitsiMeetApi
  readonly conference: JitsiConference
  readonly info: Pick<CallJoin, 'canSpeak' | 'canStreamVideo'>
  readonly resources: JitsiEngineResources
  readonly localVideoKinds: WeakMap<JitsiTrack, 'video' | 'desktop'>
  readonly microphoneDeviceId: string
  readonly microphoneMuted: boolean
  readonly deafened: boolean
  readonly current: () => boolean
  readonly observeTrack: (track: JitsiTrack, kind?: 'video' | 'desktop') => void
  readonly setTrack: (track: JitsiTrack, remove?: boolean) => void
  readonly stopScreenAudio: () => Promise<void>
  readonly refreshDevices: () => Promise<void>
}) {
  try {
    for (const track of [...resources.localTracks]) {
      const retainedKind = track.getType() === 'video'
        ? localVideoKind(track, localVideoKinds.get(track))
        : undefined
      if (!retainedTrackAllowed(track, info)) {
        resources.localTracks = resources.localTracks.filter((item) => item !== track)
        setTrack(track, true)
        await track.dispose().catch(() => undefined)
        if (
          retainedKind === 'desktop'
          || resources.screenAudio?.microphoneTrack === track
        ) await stopScreenAudio()
        continue
      }
      observeTrack(track, retainedKind)
      try {
        await conference.addTrack(track)
      } catch {
        resources.localTracks = resources.localTracks.filter((item) => item !== track)
        setTrack(track, true)
        await track.dispose().catch(() => undefined)
        if (
          retainedKind === 'desktop'
          || resources.screenAudio?.microphoneTrack === track
        ) await stopScreenAudio()
      }
    }

    const hasAudio = resources.localTracks.some((track) => track.getType() === 'audio')
    if (info.canSpeak && !hasAudio) {
      const localTracks = await jitsi.createLocalTracks({
        devices: ['audio'],
        ...(microphoneDeviceId ? { micDeviceId: microphoneDeviceId } : {}),
      })
      if (!current()) {
        await Promise.all(localTracks.map((track) => track.dispose()))
        return
      }
      resources.localTracks.push(...localTracks)
      for (const track of localTracks) {
        if (microphoneMuted || deafened) await track.mute()
        try {
          observeTrack(track)
          await conference.addTrack(track)
        } catch (caught) {
          resources.localTracks = resources.localTracks.filter((item) => item !== track)
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
}
