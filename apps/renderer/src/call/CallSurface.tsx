import {
  AudioLines,
  Headphones,
  Mic,
  MicOff,
  Maximize2,
  Minimize2,
  MonitorUp,
  PhoneOff,
  RotateCcw,
  Settings2,
  UserX,
  Video,
  VideoOff,
  Volume2,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { JitsiTrack } from 'lib-jitsi-meet'
import type { CallParticipantRecord, Channel } from '@thiscord/shared'
import { mergeCallParticipants, useCall, type CallParticipant } from './CallProvider'

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || '?'
}

function TrackElement({ track, audio = false, muted = false, screen = false, speakerDeviceId = '' }: {
  readonly track: JitsiTrack
  readonly audio?: boolean
  readonly muted?: boolean
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
    if (audio && target?.setSinkId && speakerDeviceId) void target.setSinkId(speakerDeviceId).catch(() => undefined)
  }, [audio, speakerDeviceId])
  return audio
    ? <audio ref={(node) => { element.current = node }} autoPlay muted={muted} />
    : <video
        className={screen ? 'screen-media' : 'camera-media'}
        ref={(node) => { element.current = node }}
        autoPlay
        muted={track.isLocal()}
        onLoadedMetadata={(event) => void event.currentTarget.play().catch(() => undefined)}
        playsInline
      />
}

function ParticipantTile({ participant, featured = false, canMute = false, canRemove = false, onModerate, onSpotlight }: {
  readonly participant: CallParticipant
  readonly featured?: boolean
  readonly canMute?: boolean
  readonly canRemove?: boolean
  readonly onModerate?: (participantId: string, action: 'mute' | 'kick') => void
  readonly onSpotlight?: (track: JitsiTrack | null) => void
}) {
  const videoTrack = participant.screenTrack ?? participant.videoTrack
  return (
    <article className={`voice-tile ${participant.speaking ? 'speaking' : ''} ${featured ? 'sharing' : ''} ${participant.screenTrack ? 'screen-share' : ''}`}>
      {videoTrack ? <TrackElement track={videoTrack} screen={Boolean(participant.screenTrack)} /> : <span className="call-avatar">{initials(participant.name)}</span>}
      {videoTrack && onSpotlight ? (
        <button
          className="voice-tile-focus"
          type="button"
          title={featured ? 'Remove spotlight' : `Spotlight ${participant.name}${participant.screenTrack ? '’s screen' : ''}`}
          aria-label={featured ? `Remove ${participant.name} from spotlight` : `Spotlight ${participant.name}${participant.screenTrack ? '’s screen' : ''}`}
          aria-pressed={featured}
          onClick={() => onSpotlight(featured ? null : videoTrack)}
        >
          {featured ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      ) : null}
      <div className="voice-tile-label">
        <span>{participant.name}{participant.local ? ' (You)' : ''}</span>
        {participant.screenTrack ? <span className="sharing-label"><MonitorUp size={12} />Screen</span> : null}
        {participant.muted ? <MicOff size={12} /> : <Mic size={12} />}
      </div>
      {(canMute || canRemove) && !participant.local && !participant.id.startsWith('presence:') ? (
        <div className="voice-tile-moderation">
          {canMute ? <button type="button" title="Mute participant" onClick={() => onModerate?.(participant.id, 'mute')}><MicOff size={14} /></button> : null}
          {canRemove ? <button type="button" title="Remove participant" onClick={() => {
            if (window.confirm(`Remove ${participant.name} from this call?`)) onModerate?.(participant.id, 'kick')
          }}><UserX size={14} /></button> : null}
        </div>
      ) : null}
    </article>
  )
}

export function VoiceChannelSurface({ channel, occupancy }: {
  readonly channel: Channel
  readonly occupancy: readonly CallParticipantRecord[]
}) {
  const call = useCall()
  const { prioritizeVideo, session } = call
  const [devicesOpen, setDevicesOpen] = useState(false)
  const [spotlightTrack, setSpotlightTrack] = useState<JitsiTrack | null>(null)
  const visibleParticipants = session?.channel.id === channel.id
    ? mergeCallParticipants(session.participants, occupancy, channel.id)
    : []
  const spotlightParticipant = visibleParticipants.find((participant) => (
    participant.screenTrack === spotlightTrack || participant.videoTrack === spotlightTrack
  )) ?? null
  const spotlightScreenTrack = spotlightParticipant?.screenTrack ?? null
  const spotlightVideoTrack = spotlightParticipant?.videoTrack ?? null
  const spotlightIsLocal = spotlightParticipant?.local ?? false

  useEffect(() => {
    if (session?.channel.id === channel.id) {
      prioritizeVideo(spotlightScreenTrack, spotlightVideoTrack, spotlightIsLocal)
    }
  }, [channel.id, prioritizeVideo, session?.channel.id, spotlightIsLocal, spotlightScreenTrack, spotlightVideoTrack])

  if (!session) {
    return (
      <div className="voice-view call-connecting call-idle">
        <Headphones size={28} />
        <strong>Not connected</strong>
        <span>Select {channel.name} in the channel list to connect.</span>
      </div>
    )
  }

  if (session.channel.id !== channel.id) {
    return (
      <div className="voice-view call-connecting">
        <Headphones size={28} />
        <strong>Connected to {session.channel.name}</strong>
        <span>Select {channel.name} in the channel list to switch.</span>
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
      onModerate={(id, action) => void call.moderateParticipant(id, action)}
      onSpotlight={setSpotlightTrack}
      key={participant.id}
    />
  )

  return (
    <div className="voice-view native-call">
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
          <h1>{channel.name}</h1>
          <p>{channel.topic || `${visibleParticipants.length} connected`}</p>
        </div>
        <div className="voice-stage-meta"><span>{visibleParticipants.length} participant{visibleParticipants.length === 1 ? '' : 's'}</span></div>
      </header>

      {session.status === 'error' ? (
        <div className="native-call-error">
          <strong>Couldn’t connect to this voice channel</strong>
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
        <section className="call-device-panel" aria-label="Call devices">
          <label><Mic size={14} /><span>Microphone</span><select value={call.microphoneDeviceId} onChange={(event) => void call.selectMicrophone(event.target.value)}><option value="">System default</option>{call.devices.filter((device) => device.kind === 'audioinput').map((device, index) => <option value={device.deviceId} key={device.deviceId}>{device.label || `Microphone ${index + 1}`}</option>)}</select></label>
          <label><Video size={14} /><span>Camera</span><select value={call.cameraDeviceId} onChange={(event) => void call.selectCamera(event.target.value)}><option value="">System default</option>{call.devices.filter((device) => device.kind === 'videoinput').map((device, index) => <option value={device.deviceId} key={device.deviceId}>{device.label || `Camera ${index + 1}`}</option>)}</select></label>
          <label><Volume2 size={14} /><span>Speaker</span><select value={call.speakerDeviceId} onChange={(event) => void call.selectSpeaker(event.target.value)}><option value="">System default</option>{call.devices.filter((device) => device.kind === 'audiooutput').map((device, index) => <option value={device.deviceId} key={device.deviceId}>{device.label || `Speaker ${index + 1}`}</option>)}</select></label>
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
        <button className={`control-button ${session.screenSharing ? 'active' : ''}`} type="button" title={session.canStreamVideo ? '' : 'You do not have permission to share video'} disabled={session.actionBusy || !session.canStreamVideo} onClick={() => void call.toggleScreenShare()}>
          <MonitorUp size={18} /><span>{session.screenSharing ? 'Stop sharing' : 'Share screen'}</span>
        </button>
        <button className={`control-button ${devicesOpen ? 'active' : ''}`} type="button" onClick={() => { setDevicesOpen((value) => !value); void call.refreshDevices() }}>
          <Settings2 size={18} /><span>Devices</span>
        </button>
        <button className="control-button leave-control" type="button" onClick={() => void call.leave()}>
          <PhoneOff size={18} /><span>Disconnect</span>
        </button>
      </div>
    </div>
  )
}

export function CallDock({ onOpen }: { readonly onOpen: (channel: Channel) => void }) {
  const call = useCall()
  const { session } = call
  if (!session) return null
  return (
    <div className="voice-connected">
      <div className="call-dock-status">
        <button className="call-dock-main" type="button" onClick={() => onOpen(session.channel)}>
          <span className={`call-status-icon ${session.status}`}><AudioLines size={16} /></span>
          <span><strong>{session.status === 'connected' ? 'Voice Connected' : session.status === 'error' ? 'Connection failed' : session.status === 'reconnecting' ? 'Reconnecting' : 'Connecting'}</strong><small>{session.channel.name}</small></span>
        </button>
        <button type="button" title="Disconnect" onClick={() => void call.leave()}><PhoneOff size={15} /></button>
      </div>
      {session.error ? <div className="call-dock-warning" title={session.error}>{session.error}</div> : null}
      <div className="call-dock-media">
        <button className={session.cameraEnabled ? 'active' : ''} type="button" title={!session.canStreamVideo ? 'You do not have permission to share video' : session.cameraEnabled ? 'Turn off camera' : 'Turn on camera'} disabled={session.actionBusy || !session.canStreamVideo} onClick={() => void call.toggleCamera()}>
          {session.cameraEnabled ? <Video size={17} /> : <VideoOff size={17} />}
        </button>
        <button className={session.screenSharing ? 'active' : ''} type="button" title={!session.canStreamVideo ? 'You do not have permission to share video' : session.screenSharing ? 'Stop sharing' : 'Share your screen'} disabled={session.actionBusy || !session.canStreamVideo} onClick={() => void call.toggleScreenShare()}>
          <MonitorUp size={17} />
        </button>
      </div>
      <div className="call-audio" aria-hidden="true">
        {session.participants
          .filter((participant) => !participant.local && participant.audioTrack)
          .map((participant) => <TrackElement track={participant.audioTrack!} audio muted={session.deafened} speakerDeviceId={call.speakerDeviceId} key={participant.id} />)}
      </div>
    </div>
  )
}
