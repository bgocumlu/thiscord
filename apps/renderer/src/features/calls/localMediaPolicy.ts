import type { CallJoin } from '@thiscord/shared'
import type { JitsiConference, JitsiTrack } from 'lib-jitsi-meet'
import type { MutableParticipant } from './types'

export type RejectedMediaType = 'audio' | 'video' | 'desktop'

export function localVideoKind(
  track: JitsiTrack,
  remembered: 'video' | 'desktop' | undefined,
) {
  if (remembered) return remembered
  return String(track.getVideoType() ?? '').startsWith('desktop') ? 'desktop' : 'video'
}

export function retainedTrackAllowed(track: JitsiTrack, access: Pick<CallJoin, 'canSpeak' | 'canStreamVideo'>) {
  const permitted = track.getType() === 'audio' ? access.canSpeak : access.canStreamVideo
  const ended = (track as JitsiTrack & { isEnded?: () => boolean }).isEnded?.() ?? false
  return permitted && !ended
}

export function rejectedLocalMedia(
  participant: MutableParticipant | undefined,
  access: Pick<CallJoin, 'canSpeak' | 'canStreamVideo'>,
): RejectedMediaType[] {
  const rejected: RejectedMediaType[] = []
  if (!access.canSpeak && participant?.audioTrack && !participant.audioTrack.isMuted()) {
    rejected.push('audio')
  }
  if (!access.canStreamVideo && participant?.videoTrack) rejected.push('video')
  if (!access.canStreamVideo && participant?.screenTrack) rejected.push('desktop')
  return rejected
}

export async function discardLocalTrack(
  track: JitsiTrack,
  context: {
    readonly conference: JitsiConference | null
    readonly removeTrack: (track: JitsiTrack) => void
    readonly synchronizeTrack: (
      track: JitsiTrack,
      remove?: boolean,
      localVideoKind?: 'video' | 'desktop',
    ) => void
    readonly localVideoKind?: 'video' | 'desktop'
  },
) {
  await context.conference?.removeTrack(track).catch(() => undefined)
  context.synchronizeTrack(track, true, context.localVideoKind)
  context.removeTrack(track)
  await track.dispose().catch(() => undefined)
}

export async function replacePublishedLocalTrack(
  existing: JitsiTrack,
  replacement: JitsiTrack,
  context: {
    readonly conference: JitsiConference
    readonly addTrack: (track: JitsiTrack) => void
    readonly removeTrack: (track: JitsiTrack) => void
    readonly synchronizeTrack: (
      track: JitsiTrack,
      remove?: boolean,
      localVideoKind?: 'video' | 'desktop',
    ) => void
    readonly localVideoKind?: 'video' | 'desktop'
  },
) {
  await context.conference.replaceTrack(existing, replacement)
  context.addTrack(replacement)
  context.synchronizeTrack(replacement, false, context.localVideoKind)
  context.synchronizeTrack(existing, true, context.localVideoKind)
  context.removeTrack(existing)
  await existing.dispose().catch(() => undefined)
}

export async function enforceLocalMediaRejection(
  mediaType: RejectedMediaType,
  context: {
    readonly conference: JitsiConference | null
    readonly participant: MutableParticipant | undefined
    readonly removeTrack: (track: JitsiTrack) => void
    readonly synchronizeTrack: (
      track: JitsiTrack,
      remove?: boolean,
      localVideoKind?: 'video' | 'desktop',
    ) => void
    readonly stopScreenAudio: () => Promise<void>
  },
) {
  if (mediaType === 'audio') {
    const audio = context.participant?.audioTrack
    if (audio && !audio.isMuted()) await audio.mute()
    if (audio) context.synchronizeTrack(audio)
    return
  }

  const track = mediaType === 'desktop'
    ? context.participant?.screenTrack
    : context.participant?.videoTrack
  let cleanupError: unknown
  if (track) {
    try {
      await context.conference?.removeTrack(track)
    } catch (caught) {
      cleanupError = caught
    }
    context.synchronizeTrack(track, true, mediaType)
    context.removeTrack(track)
    try {
      await track.dispose()
    } catch (caught) {
      cleanupError ??= caught
    }
  }
  if (mediaType === 'desktop') await context.stopScreenAudio()
  if (cleanupError) throw cleanupError
}
