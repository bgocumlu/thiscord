import type {
  CallTargetDescriptor,
} from '@thiscord/shared'
import type { JitsiTrack } from 'lib-jitsi-meet'

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
  readonly target: CallTargetDescriptor
  readonly status: Exclude<CallStatus, 'idle'>
  readonly error: string
  readonly participants: readonly CallParticipant[]
  readonly microphoneMuted: boolean
  readonly deafened: boolean
  readonly cameraEnabled: boolean
  readonly screenSharing: boolean
  readonly actionBusy: boolean
  readonly canSpeak: boolean
  readonly canStreamVideo: boolean
  readonly canMuteMembers: boolean
  readonly canRemoveMembers: boolean
}

export interface CallContextValue {
  readonly session: CallSession | null
  readonly microphoneMuted: boolean
  readonly deafened: boolean
  readonly join: (target: CallTargetDescriptor) => Promise<void>
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
  readonly moderateParticipant: (userId: string, action: 'mute' | 'kick') => Promise<void>
}

export interface MutableParticipant {
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
