import {
  AudioLines,
  Fullscreen,
  Headphones,
  Mic,
  MicOff,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  MonitorUp,
  PhoneOff,
  RotateCcw,
  Settings2,
  Shrink,
  Video,
  VideoOff,
  Volume2,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { JitsiTrack } from 'lib-jitsi-meet'
import type { CallParticipantRecord, CallTargetDescriptor, Channel } from '@thiscord/shared'
import { useCall, useParticipantSpeaking } from './CallProvider'
import { mergeCallParticipants } from './participantSync'
import type { CallParticipant } from './types'
import { channelCallTarget, sameCallTarget } from './targets'
import { setAudioOutputDevice } from './speakerOutput'
import {
  ContextMenu,
  type ContextMenuPoint,
} from '../../components/ContextMenu'
import { keyboardContextMenuPoint } from '../../components/contextMenuPosition'
import { MemberContextMenuItems } from '../members/MemberContextMenuItems'
import type { MemberInteractions } from '../members/memberInteractions'
import type { RemoteAudioPreference } from './remoteAudioPreferences'

function deviceOptions(
  devices: readonly MediaDeviceInfo[],
  kind: MediaDeviceKind,
  fallbackLabel: string,
) {
  let index = 0
  return devices.flatMap((device) => {
    if (device.kind !== kind) return []
    index += 1
    return [
      <option value={device.deviceId} key={device.deviceId}>
        {device.label || `${fallbackLabel} ${index}`}
      </option>,
    ]
  })
}

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || '?'
}

function TrackElement({ track, audio = false, muted = false, volume = 100, screen = false, speakerDeviceId = '' }: {
  readonly track: JitsiTrack
  readonly audio?: boolean
  readonly muted?: boolean
  readonly volume?: number
  readonly screen?: boolean
  readonly speakerDeviceId?: string
}) {
  const element = useRef<HTMLMediaElement>(null)
  useEffect(() => {
    const target = element.current
    if (!target) return
    void track.attach(target)
    return () => track.detach(target)
  }, [track])
  useEffect(() => {
    const target = element.current as (HTMLMediaElement & { setSinkId?: (id: string) => Promise<void> }) | null
    if (audio && target) void setAudioOutputDevice(target, speakerDeviceId).catch(() => undefined)
  }, [audio, speakerDeviceId])
  useEffect(() => {
    if (audio && element.current) element.current.volume = Math.max(0, Math.min(1, volume / 100))
  }, [audio, volume])
  return audio
    ? (
        // Remote WebRTC audio has no static timed-text source; live captions require a transcription pipeline.
        // oxlint-disable-next-line react-doctor/media-has-caption
        <audio ref={(node) => { element.current = node }} autoPlay muted={muted} />
      )
    : <video
        className={`${screen ? 'screen-media' : 'camera-media'} ${track.isLocal() && !screen ? 'local-camera-media' : ''}`.trim()}
        ref={(node) => { element.current = node }}
        autoPlay
        muted
        onLoadedMetadata={(event) => void event.currentTarget.play().catch(() => undefined)}
        playsInline
      />
}

function ParticipantTile({
  participant,
  featured = false,
  canMute = false,
  canRemove = false,
  onModerate,
  onSpotlight,
  memberInteractions,
  remoteAudio,
  onRemoteMutedChange,
  onRemoteVolumeChange,
}: {
  readonly participant: CallParticipant
  readonly featured?: boolean
  readonly canMute?: boolean
  readonly canRemove?: boolean
  readonly onModerate?: (
    participantId: string,
    action: 'server_mute' | 'server_unmute' | 'kick',
  ) => void
  readonly onSpotlight?: (participantId: string) => void
  readonly memberInteractions?: MemberInteractions
  readonly remoteAudio?: RemoteAudioPreference
  readonly onRemoteMutedChange?: (muted: boolean) => void
  readonly onRemoteVolumeChange?: (volume: number) => void
}) {
  const tileElement = useRef<HTMLElement>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [menuPoint, setMenuPoint] = useState<ContextMenuPoint | null>(null)
  const speaking = useParticipantSpeaking(participant.id)
  const videoTrack = participant.screenTrack ?? participant.videoTrack
  const membership = memberInteractions?.memberships?.find(
    (item) => item.user === participant.userId,
  )
  const canModerateHierarchy = Boolean(
    participant.userId && memberInteractions?.canModerateUser?.(participant.userId),
  )
  const hasMenu = Boolean(
    participant.user
    || (!participant.local && participant.userId && (
      participant.audioTrack
      || videoTrack
      || ((canMute || canRemove) && canModerateHierarchy)
    )),
  )

  useEffect(() => {
    const updateFullscreen = () => setFullscreen(document.fullscreenElement === tileElement.current)
    document.addEventListener('fullscreenchange', updateFullscreen)
    return () => document.removeEventListener('fullscreenchange', updateFullscreen)
  }, [])

  const toggleFullscreen = async () => {
    const tile = tileElement.current
    if (!tile) return
    if (document.fullscreenElement === tile) {
      await document.exitFullscreen()
      return
    }
    if (document.fullscreenElement) await document.exitFullscreen()
    await tile.requestFullscreen()
  }

  return (
    <article
      ref={tileElement}
      className={`voice-tile ${speaking ? 'speaking' : ''} ${featured ? 'spotlighted' : ''} ${participant.screenTrack ? 'screen-share' : ''}`}
      tabIndex={hasMenu ? 0 : undefined}
      aria-label={`${participant.name}${participant.local ? ', you' : ''}`}
      onContextMenu={hasMenu ? (event) => {
        event.preventDefault()
        setMenuPoint({ x: event.clientX, y: event.clientY })
      } : undefined}
      onKeyDown={hasMenu ? (event) => {
        const point = keyboardContextMenuPoint(event)
        if (point) setMenuPoint(point)
      } : undefined}
    >
      {videoTrack ? <TrackElement track={videoTrack} screen={Boolean(participant.screenTrack)} /> : <span className="call-avatar">{initials(participant.name)}</span>}
      {videoTrack ? (
        <div className="voice-tile-view-actions">
          {onSpotlight ? (
            <button
              className="voice-tile-focus"
              type="button"
              title={featured ? 'Remove spotlight' : `Spotlight ${participant.name}${participant.screenTrack ? '’s screen' : ''}`}
              aria-label={featured ? `Remove ${participant.name} from spotlight` : `Spotlight ${participant.name}${participant.screenTrack ? '’s screen' : ''}`}
              aria-pressed={featured}
              onClick={() => onSpotlight(participant.id)}
            >
              {featured ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          ) : null}
          {participant.screenTrack ? (
            <button
              className="voice-tile-fullscreen"
              type="button"
              title={fullscreen ? 'Exit full screen' : `View ${participant.name}’s screen in full screen`}
              aria-label={fullscreen ? `Exit ${participant.name}’s full screen share` : `View ${participant.name}’s screen share in full screen`}
              aria-pressed={fullscreen}
              onClick={() => void toggleFullscreen().catch(() => undefined)}
            >
              {fullscreen ? <Shrink size={14} /> : <Fullscreen size={14} />}
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="voice-tile-label">
        <span>{participant.name}{participant.local ? ' (You)' : ''}</span>
        {participant.screenTrack ? <span className="sharing-label"><MonitorUp size={12} />Screen</span> : null}
        {participant.serverMuted
          ? <MicOff className="voice-tile-server-muted" size={12} aria-label="Server muted" />
          : participant.muted
            ? <MicOff size={12} />
            : <Mic size={12} />}
      </div>
      {hasMenu ? (
        <div className="voice-tile-moderation">
          <button
            className="voice-tile-context-trigger"
            type="button"
            title={`More actions for ${participant.name}`}
            aria-label={`More actions for ${participant.name}`}
            onClick={(event) => {
              const bounds = event.currentTarget.getBoundingClientRect()
              setMenuPoint({ x: bounds.right, y: bounds.bottom })
            }}
          ><MoreHorizontal size={15} /></button>
        </div>
      ) : null}
      {menuPoint ? (
        <ContextMenu
          point={menuPoint}
          label={`Actions for ${participant.name}`}
          onClose={() => setMenuPoint(null)}
        >
          <MemberContextMenuItems
            user={participant.user}
            membership={membership}
            currentUserId={memberInteractions?.currentUserId ?? ''}
            onOpenProfile={participant.user && memberInteractions
              ? () => memberInteractions.onOpenProfile(participant.user!)
              : undefined}
            onMessage={participant.user && memberInteractions
              ? () => memberInteractions.onMessage(participant.user!)
              : undefined}
            localAudio={!participant.local && participant.audioTrack && remoteAudio
              ? {
                  muted: remoteAudio.muted,
                  volume: remoteAudio.volume,
                  onMutedChange: onRemoteMutedChange ?? (() => undefined),
                  onVolumeChange: onRemoteVolumeChange ?? (() => undefined),
                }
              : undefined}
            spotlight={videoTrack && onSpotlight
              ? {
                  active: featured,
                  onToggle: () => onSpotlight(participant.id),
                }
              : undefined}
            callModeration={!participant.local && participant.userId && canModerateHierarchy
              ? {
                  serverMuted: participant.serverMuted,
                  canServerMute: canMute,
                  canDisconnect: canRemove,
                  onServerMuteChange: (serverMuted) => onModerate?.(
                    participant.userId,
                    serverMuted ? 'server_mute' : 'server_unmute',
                  ),
                  onDisconnect: () => {
                    if (window.confirm(`Disconnect ${participant.name} from this call?`)) {
                      onModerate?.(participant.userId, 'kick')
                    }
                  },
                }
              : undefined}
            communityModeration={
              membership
              && memberInteractions?.canManageMembers
              && canModerateHierarchy
              && memberInteractions.onModerate
                ? {
                    onAction: (action) => memberInteractions.onModerate?.(membership, action),
                  }
                : undefined
            }
          />
        </ContextMenu>
      ) : null}
    </article>
  )
}

export function CallSurface({
  target,
  occupancy,
  description = '',
  presentation = 'full',
  memberInteractions,
}: {
  readonly target: CallTargetDescriptor
  readonly occupancy: readonly CallParticipantRecord[]
  readonly description?: string
  readonly presentation?: 'full' | 'conversation'
  readonly memberInteractions?: MemberInteractions
}) {
  interface SpotlightSelection {
    readonly targetKey: string
    readonly participantId: string
    readonly track: JitsiTrack
  }

  const call = useCall()
  const { prioritizeVideo, session } = call
  const targetKey = `${target.target.kind}:${target.target.id}`
  const screenShareAvailable = Boolean(window.desktop || navigator.mediaDevices?.getDisplayMedia)
  const [devicesOpen, setDevicesOpen] = useState(false)
  const [spotlightSelection, setSpotlightSelection] = useState<SpotlightSelection | null>(null)
  const focusedOnTarget = Boolean(session && sameCallTarget(session.target.target, target.target))
  const visibleParticipants = session && focusedOnTarget
    ? mergeCallParticipants(session.participants, occupancy, target.target)
    : []
  const spotlightParticipant = spotlightSelection?.targetKey === targetKey
    ? visibleParticipants.find((participant) => (
        participant.id === spotlightSelection.participantId
        && (participant.screenTrack ?? participant.videoTrack) === spotlightSelection.track
      )) ?? null
    : null
  const spotlightScreenTrack = spotlightParticipant?.screenTrack ?? null
  const spotlightVideoTrack = spotlightParticipant?.videoTrack ?? null
  const spotlightIsLocal = spotlightParticipant?.local ?? false

  const toggleSpotlight = (participantId: string) => {
    const participant = visibleParticipants.find((item) => item.id === participantId)
    const track = participant?.screenTrack ?? participant?.videoTrack
    if (!track) return
    setSpotlightSelection((current) => (
      current?.targetKey === targetKey
      && current.participantId === participantId
      && current.track === track
        ? null
        : { targetKey, participantId, track }
    ))
  }

  useEffect(() => {
    if (focusedOnTarget) {
      prioritizeVideo(spotlightScreenTrack, spotlightVideoTrack, spotlightIsLocal)
    }
  }, [focusedOnTarget, prioritizeVideo, spotlightIsLocal, spotlightScreenTrack, spotlightVideoTrack])

  if (!session) {
    return (
      <div className="voice-view call-connecting call-idle">
        <Headphones size={28} />
        <strong>Not connected</strong>
        <span>Start or join {target.name} to connect.</span>
      </div>
    )
  }

  if (!focusedOnTarget) {
    return (
      <div className="voice-view call-connecting">
        <Headphones size={28} />
        <strong>Connected to {session.target.name}</strong>
        <span>Start or join {target.name} to switch.</span>
      </div>
    )
  }

  const remaining = spotlightParticipant
    ? visibleParticipants.filter((participant) => participant.id !== spotlightParticipant.id)
    : visibleParticipants
  const tile = (participant: CallParticipant, featured = false) => (
    <ParticipantTile
      participant={participant}
      featured={featured}
      canMute={session.canMuteMembers}
      canRemove={session.canRemoveMembers}
      onModerate={(_id, action) => void call.moderateParticipant(participant.userId, action)}
      onSpotlight={toggleSpotlight}
      memberInteractions={memberInteractions}
      remoteAudio={!participant.local && participant.userId
        ? call.remoteAudioFor(participant.userId)
        : undefined}
      onRemoteMutedChange={(muted) => call.setRemoteUserMuted(participant.userId, muted)}
      onRemoteVolumeChange={(volume) => call.setRemoteUserVolume(participant.userId, volume)}
      key={participant.id}
    />
  )

  return (
    <section
      className={`voice-view native-call ${presentation === 'conversation' ? 'conversation-call' : ''}`}
      aria-label={`${target.name} call`}
    >
      <header className="voice-stage-header">
        <div>
          <span className={`live-label ${session.status === 'error' ? 'failed' : ''}`}><i />{
            session.status === 'connected'
              ? 'Voice connected'
              : session.status === 'reconnecting'
                ? 'Reconnecting'
                : session.status === 'error'
                  ? 'Connection failed'
                  : 'Connecting'
          }</span>
          <h1>{target.name}</h1>
          <p>{description || `${visibleParticipants.length} connected`}</p>
        </div>
        <div className="voice-stage-meta"><span>{visibleParticipants.length} participant{visibleParticipants.length === 1 ? '' : 's'}</span></div>
      </header>

      {session.status === 'error' ? (
        <div className="native-call-error">
          <strong>Couldn’t connect to this call</strong>
          <p>{session.error}</p>
          <button type="button" onClick={() => void call.retry()}><RotateCcw size={15} />Retry</button>
        </div>
      ) : (
        spotlightParticipant ? (
          <div className={`voice-stage-layout ${remaining.length ? '' : 'spotlight-only'}`}>
            {tile(spotlightParticipant, true)}
            {remaining.length ? <div className="voice-filmstrip">{remaining.map((participant) => tile(participant))}</div> : null}
          </div>
        ) : (
          <div className={`voice-grid ${visibleParticipants.length === 1 ? 'solo' : ''} ${visibleParticipants.some((participant) => participant.screenTrack || participant.videoTrack) ? 'has-media' : ''}`}>
            {remaining.map((participant) => tile(participant))}
          </div>
        )
      )}

      {session.error && session.status !== 'error' ? <div className="call-warning">{session.error}</div> : null}
      {devicesOpen ? (
        <section id="call-device-panel" className="call-device-panel" aria-label="Call devices">
          <label><Mic size={14} /><span>Microphone</span><select value={call.microphoneDeviceId} onChange={(event) => void call.selectMicrophone(event.target.value)}><option value="">System default</option>{deviceOptions(call.devices, 'audioinput', 'Microphone')}</select></label>
          <label><Video size={14} /><span>Camera</span><select value={call.cameraDeviceId} onChange={(event) => void call.selectCamera(event.target.value)}><option value="">System default</option>{deviceOptions(call.devices, 'videoinput', 'Camera')}</select></label>
          <label><Volume2 size={14} /><span>Speaker</span><select value={call.speakerDeviceId} onChange={(event) => void call.selectSpeaker(event.target.value)}><option value="">System default</option>{deviceOptions(call.devices, 'audiooutput', 'Speaker')}</select></label>
        </section>
      ) : null}
      <div className="voice-controls">
        <button className={`control-button ${session.microphoneMuted ? 'off' : ''}`} type="button" title={session.canSpeak ? '' : 'You do not have permission to speak'} disabled={session.actionBusy || !session.canSpeak} onClick={() => void call.toggleMicrophone()}>
          {session.microphoneMuted ? <MicOff size={18} /> : <Mic size={18} />}<span>{session.microphoneMuted ? 'Unmute' : 'Mute'}</span>
        </button>
        <button className={`control-button ${session.deafened ? 'active' : ''}`} type="button" disabled={session.actionBusy} onClick={() => void call.toggleDeafen()}>
          <Headphones size={18} /><span>{session.deafened ? 'Undeafen' : 'Deafen'}</span>
        </button>
        <button className={`control-button ${session.cameraEnabled ? '' : 'off'}`} type="button" title={session.canStreamVideo ? '' : 'You do not have permission to share video'} disabled={session.actionBusy || !session.canStreamVideo} onClick={() => void call.toggleCamera()}>
          {session.cameraEnabled ? <Video size={18} /> : <VideoOff size={18} />}<span>{session.cameraEnabled ? 'Camera off' : 'Camera'}</span>
        </button>
        {screenShareAvailable ? (
          <button className={`control-button screen-share-action ${session.screenSharing ? 'active' : ''}`} type="button" title={session.canStreamVideo ? '' : 'You do not have permission to share video'} disabled={session.actionBusy || !session.canStreamVideo} onClick={() => void call.toggleScreenShare()}>
            <MonitorUp size={18} /><span>{session.screenSharing ? 'Stop sharing' : 'Share screen'}</span>
          </button>
        ) : null}
        <button
          className={`control-button ${devicesOpen ? 'active' : ''}`}
          type="button"
          aria-expanded={devicesOpen}
          aria-controls="call-device-panel"
          onClick={() => { setDevicesOpen((value) => !value); void call.refreshDevices() }}
        >
          <Settings2 size={18} /><span>Devices</span>
        </button>
        <button className="control-button leave-control" type="button" onClick={() => void call.leave()}>
          <PhoneOff size={18} /><span>Disconnect</span>
        </button>
      </div>
    </section>
  )
}

export function VoiceChannelSurface({ channel, occupancy, memberInteractions }: {
  readonly channel: Channel
  readonly occupancy: readonly CallParticipantRecord[]
  readonly memberInteractions?: MemberInteractions
}) {
  return (
    <CallSurface
      target={channelCallTarget(channel)}
      occupancy={occupancy}
      description={channel.topic}
      memberInteractions={memberInteractions}
    />
  )
}

export function CallDock({ onOpen }: { readonly onOpen: (target: CallTargetDescriptor) => void }) {
  const call = useCall()
  const { session } = call
  const screenShareAvailable = Boolean(window.desktop || navigator.mediaDevices?.getDisplayMedia)
  if (!session) return null
  return (
    <div className="voice-connected">
      <div className="call-dock-status">
        <button className="call-dock-main" type="button" onClick={() => onOpen(session.target)}>
          <span className={`call-status-icon ${session.status}`}><AudioLines size={16} /></span>
          <span><strong>{session.status === 'connected' ? 'Voice Connected' : session.status === 'error' ? 'Connection failed' : session.status === 'reconnecting' ? 'Reconnecting' : 'Connecting'}</strong><small>{session.target.name}</small></span>
        </button>
        <button type="button" title="Disconnect" onClick={() => void call.leave()}><PhoneOff size={15} /></button>
      </div>
      {session.error ? <div className="call-dock-warning" title={session.error}>{session.error}</div> : null}
      <div className="call-dock-media">
        <button className={session.cameraEnabled ? 'active' : ''} type="button" title={!session.canStreamVideo ? 'You do not have permission to share video' : session.cameraEnabled ? 'Turn off camera' : 'Turn on camera'} disabled={session.actionBusy || !session.canStreamVideo} onClick={() => void call.toggleCamera()}>
          {session.cameraEnabled ? <Video size={17} /> : <VideoOff size={17} />}
        </button>
        {screenShareAvailable ? (
          <button className={`screen-share-action ${session.screenSharing ? 'active' : ''}`} type="button" title={!session.canStreamVideo ? 'You do not have permission to share video' : session.screenSharing ? 'Stop sharing' : 'Share your screen'} disabled={session.actionBusy || !session.canStreamVideo} onClick={() => void call.toggleScreenShare()}>
            <MonitorUp size={17} />
          </button>
        ) : null}
      </div>
      <div className="call-audio" aria-hidden="true">
        {session.participants.flatMap((participant) => {
          if (participant.local || !participant.audioTrack) return []
          const preference = call.remoteAudioFor(participant.userId)
          return [
            (
              <TrackElement
                track={participant.audioTrack}
                audio
                muted={session.deafened || preference.muted}
                volume={preference.volume}
                speakerDeviceId={call.speakerDeviceId}
                key={participant.id}
              />
            ),
          ]
        })}
      </div>
    </div>
  )
}
