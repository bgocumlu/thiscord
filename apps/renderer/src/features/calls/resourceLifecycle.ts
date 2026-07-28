import type { JitsiTrack } from 'lib-jitsi-meet'
import {
  createEngineResources,
  type JitsiEngineResources,
} from './jitsiEngine'

export interface RetainedMedia {
  readonly localTracks: JitsiTrack[]
  readonly screenAudio: JitsiEngineResources['screenAudio']
}

export async function disposeRetainedMedia(media: RetainedMedia) {
  await Promise.all(media.localTracks.map(async (track) => {
    try {
      await track.dispose()
    } catch {
      // A browser may have already ended a retained device or display track.
    }
  }))
  try {
    await media.screenAudio?.capturedTrack.dispose()
  } catch {
    // The browser can end display audio before its paired video track.
  }
}

export async function releaseEngineResources(
  current: JitsiEngineResources,
  preserveLocalTracks: boolean,
): Promise<{ readonly next: JitsiEngineResources; readonly retained: RetainedMedia }> {
  const retained: RetainedMedia = {
    localTracks: [...current.localTracks],
    screenAudio: current.screenAudio,
  }
  current.localTracks.length = 0
  current.screenAudio = null
  try {
    await current.conference?.leave('user-left')
  } catch {
    // Conference disposal continues even if the leave stanza fails.
  }
  if (!preserveLocalTracks) await disposeRetainedMedia(retained)
  try {
    await current.connection?.disconnect()
  } catch {
    // The transport can already be disconnected after a network failure.
  }
  return {
    next: createEngineResources(),
    retained: preserveLocalTracks ? retained : { localTracks: [], screenAudio: null },
  }
}
