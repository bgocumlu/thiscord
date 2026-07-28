import type { JitsiTrack } from 'lib-jitsi-meet'
import type { JitsiEngineResources } from './jitsiEngine'
import { LOCAL_PARTICIPANT } from './participantSync'
import type { MutableParticipant } from './types'

export interface LocalMediaRuntime {
  readonly conference: JitsiEngineResources['conference']
  readonly screenAudio: JitsiEngineResources['screenAudio']
  localParticipant(): MutableParticipant | undefined
  tracks(): readonly JitsiTrack[]
  hasTrack(track: JitsiTrack): boolean
  addTrack(track: JitsiTrack): void
  removeTrack(track: JitsiTrack): void
  setScreenAudio(screenAudio: JitsiEngineResources['screenAudio']): void
}

export function createLocalMediaRuntime(
  resources: () => JitsiEngineResources,
  participants: () => Map<string, MutableParticipant>,
): LocalMediaRuntime {
  return {
    get conference() {
      return resources().conference
    },
    get screenAudio() {
      return resources().screenAudio
    },
    localParticipant() {
      return participants().get(LOCAL_PARTICIPANT)
    },
    tracks() {
      return resources().localTracks
    },
    hasTrack(track) {
      return resources().localTracks.includes(track)
    },
    addTrack(track) {
      resources().localTracks.push(track)
    },
    removeTrack(track) {
      const current = resources()
      current.localTracks = current.localTracks.filter((item) => item !== track)
    },
    setScreenAudio(screenAudio) {
      resources().screenAudio = screenAudio
    },
  }
}
