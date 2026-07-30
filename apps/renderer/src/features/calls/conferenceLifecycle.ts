import type { CallJoin } from '@thiscord/shared'
import type {
  JitsiConference,
  JitsiConnection,
  JitsiMeetApi,
  JitsiParticipant,
  JitsiTrack,
} from 'lib-jitsi-meet'
import { t } from '../../lib/i18n'
import { jitsiConnectionOptions } from './jitsiEngine'
import type { RejectedMediaType } from './localMediaPolicy'

export interface ConferenceLifecycleHandlers {
  readonly current: () => boolean
  readonly recover: (reason: string) => void
  readonly onConferenceCreated: (conference: JitsiConference) => void
  readonly onConferenceStarted: (conference: JitsiConference) => void
  readonly onParticipantJoined: (participant: JitsiParticipant) => void
  readonly onParticipantLeft: (participantId: string) => void
  readonly onDisplayNameChanged: (participantId: string, name: string) => void
  readonly onTrackAdded: (track: JitsiTrack) => void
  readonly onTrackRemoved: (track: JitsiTrack) => void
  readonly onMediaPolicyApproved: (mediaType: RejectedMediaType) => void
  readonly onMediaPolicyRejected: (mediaType: RejectedMediaType) => void
  readonly onJoined: (conference: JitsiConference) => void
  readonly onRejected: () => void
  readonly onKicked: () => void
  readonly onInterrupted: () => void
  readonly onRestored: () => void
}

const recoverableConferenceFailures = new Set([
  'conference.iceFailed',
  'conference.focusDisconnected',
  'conference.videobridgeNotAvailable',
  'conference.connectionError',
  'conference.offerAnswerFailed',
])

export function startConferenceLifecycle(
  jitsi: JitsiMeetApi,
  info: CallJoin,
  handlers: ConferenceLifecycleHandlers,
): JitsiConnection {
  const connection = new jitsi.JitsiConnection(
    null,
    info.jwt,
    jitsiConnectionOptions(info.url),
  )
  const connectionEvents = jitsi.events.connection
  const conferenceEvents = jitsi.events.conference

  connection.addEventListener(connectionEvents.CONNECTION_FAILED, () => {
    if (handlers.current()) handlers.recover(t("calls.conferenceLifecycle.couldntReachTheMediaServer"))
  })
  connection.addEventListener(connectionEvents.CONNECTION_DISCONNECTED, () => {
    if (handlers.current()) handlers.recover(t("calls.conferenceLifecycle.theMediaConnectionWasInterrupted"))
  })
  connection.addEventListener(connectionEvents.CONNECTION_ESTABLISHED, () => {
    if (!handlers.current()) return
    const conference = connection.initJitsiConference(info.roomName, {
      openBridgeChannel: 'datachannel',
      p2p: { enabled: false, stunServers: [] },
      startSilent: false,
    })
    handlers.onConferenceCreated(conference)
    conference.setDisplayName(info.displayName)
    conference.addEventListener(conferenceEvents.USER_JOINED, (_id, participant) => {
      if (handlers.current()) handlers.onParticipantJoined(participant as JitsiParticipant)
    })
    conference.addEventListener(conferenceEvents.USER_LEFT, (participantId) => {
      if (handlers.current()) handlers.onParticipantLeft(String(participantId))
    })
    conference.addEventListener(conferenceEvents.DISPLAY_NAME_CHANGED, (participantId, name) => {
      if (handlers.current()) {
        handlers.onDisplayNameChanged(
          String(participantId),
          String(name || t("calls.conferenceLifecycle.participant")),
        )
      }
    })
    conference.addEventListener(conferenceEvents.TRACK_ADDED, (track) => {
      if (handlers.current()) handlers.onTrackAdded(track as JitsiTrack)
    })
    conference.addEventListener(conferenceEvents.TRACK_REMOVED, (track) => {
      if (handlers.current()) handlers.onTrackRemoved(track as JitsiTrack)
    })
    if (conferenceEvents.AV_MODERATION_REJECTED) {
      conference.addEventListener(conferenceEvents.AV_MODERATION_REJECTED, (detail) => {
        if (!handlers.current()) return
        const value = detail && typeof detail === 'object' && 'mediaType' in detail
          ? detail.mediaType
          : detail
        if (value === 'audio' || value === 'video' || value === 'desktop') {
          handlers.onMediaPolicyRejected(value)
        }
      })
    }
    if (conferenceEvents.AV_MODERATION_APPROVED) {
      conference.addEventListener(conferenceEvents.AV_MODERATION_APPROVED, (detail) => {
        if (!handlers.current()) return
        const value = detail && typeof detail === 'object' && 'mediaType' in detail
          ? detail.mediaType
          : detail
        if (value === 'audio' || value === 'video' || value === 'desktop') {
          handlers.onMediaPolicyApproved(value)
        }
      })
    }
    conference.addEventListener(conferenceEvents.CONFERENCE_JOINED, () => {
      if (handlers.current()) handlers.onJoined(conference)
    })
    conference.addEventListener(conferenceEvents.CONFERENCE_FAILED, (...details) => {
      if (!handlers.current()) return
      const code = String(details[0] || '')
      if (recoverableConferenceFailures.has(code)) {
        handlers.recover(t("calls.conferenceLifecycle.theCallConnectionWasInterrupted"))
      } else {
        handlers.onRejected()
      }
    })
    if (conferenceEvents.KICKED) {
      conference.addEventListener(conferenceEvents.KICKED, () => {
        if (handlers.current()) handlers.onKicked()
      })
    }
    conference.addEventListener(conferenceEvents.CONNECTION_INTERRUPTED, () => {
      if (handlers.current()) handlers.onInterrupted()
    })
    conference.addEventListener(conferenceEvents.CONNECTION_RESTORED, () => {
      if (handlers.current()) handlers.onRestored()
    })
    conference.join()
    handlers.onConferenceStarted(conference)
  })
  connection.connect({ name: info.roomName })
  return connection
}
