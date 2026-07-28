import type {
  CallParticipantRecord,
  CallTarget,
} from '@thiscord/shared'
import type {
  JitsiParticipant,
  JitsiTrack,
} from 'lib-jitsi-meet'
import { participantBelongsToTarget } from './targets'
import type {
  CallParticipant,
  MutableParticipant,
} from './types'

export const LOCAL_PARTICIPANT = 'local'

export function participantFromJitsi(participant: JitsiParticipant): MutableParticipant {
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
    serverMuted: false,
    speaking: false,
  }
}

export function createRemoteParticipant(id: string): MutableParticipant {
  return {
    id,
    userId: '',
    name: 'Participant',
    local: false,
    audioTrack: null,
    videoTrack: null,
    screenTrack: null,
    muted: true,
    serverMuted: false,
    speaking: false,
  }
}

export function synchronizeParticipantTrack(
  participants: Map<string, MutableParticipant>,
  track: JitsiTrack,
  options: {
    readonly remove?: boolean
    readonly localVideoKind?: 'video' | 'desktop'
    readonly localVideoKinds: WeakMap<JitsiTrack, 'video' | 'desktop'>
  },
) {
  const participantId = track.isLocal() ? LOCAL_PARTICIPANT : track.getParticipantId()
  let participant = participants.get(participantId)
  if (!participant && !track.isLocal()) {
    participant = createRemoteParticipant(participantId)
    participants.set(participantId, participant)
  }
  if (!participant) return
  if (options.remove) {
    if (participant.audioTrack === track) participant.audioTrack = null
    if (participant.videoTrack === track) participant.videoTrack = null
    if (participant.screenTrack === track) participant.screenTrack = null
  } else if (track.getType() === 'audio') {
    participant.audioTrack = track
  } else {
    const reportedVideoType = String(track.getVideoType() ?? '')
    const rememberedVideoKind = track.isLocal() ? options.localVideoKinds.get(track) : undefined
    const effectiveVideoKind = options.localVideoKind
      ?? (reportedVideoType
        ? (reportedVideoType.startsWith('desktop') ? 'desktop' : 'video')
        : rememberedVideoKind)
    if (track.isLocal() && effectiveVideoKind) {
      options.localVideoKinds.set(track, effectiveVideoKind)
    }
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
}

export function mergeCallParticipants(
  liveParticipants: readonly CallParticipant[],
  occupancy: readonly CallParticipantRecord[],
  target: CallTarget,
) {
  const merged = new Map<string, CallParticipant>()
  for (const record of occupancy) {
    if (!participantBelongsToTarget(record, target)) continue
    const user = record.expand?.user
    merged.set(`user:${record.user}`, {
      id: `presence:${record.id}`,
      userId: record.user,
      name: user?.displayName || user?.handle || 'Member',
      user,
      local: false,
      audioTrack: null,
      videoTrack: null,
      screenTrack: null,
      muted: record.muted,
      serverMuted: record.serverMuted,
      speaking: false,
    })
  }
  for (const participant of liveParticipants) {
    const key = participant.userId ? `user:${participant.userId}` : `jitsi:${participant.id}`
    const occupancyParticipant = merged.get(key)
    merged.set(key, occupancyParticipant
      ? {
          ...participant,
          user: occupancyParticipant.user,
          serverMuted: occupancyParticipant.serverMuted,
        }
      : participant)
  }
  return [...merged.values()]
}
