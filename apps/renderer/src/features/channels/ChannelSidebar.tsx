import type {
  CallParticipantRecord,
  CallTargetDescriptor,
  Channel,
  Community,
  Permission,
  User,
} from '@thiscord/shared'
import {
  ChevronDown,
  Hash,
  Headphones,
  Megaphone,
  Mic,
  MicOff,
  MoreVertical,
  Plus,
  Settings,
  Volume2,
} from 'lucide-react'
import type { RecordModel } from 'pocketbase'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import {
  ContextMenu,
  type ContextMenuPoint,
} from '../../components/ContextMenu'
import {
  CONTEXT_MENU_LONG_PRESS_MS,
  contextMenuLongPressMoved,
} from '../../components/contextMenuLongPress'
import { keyboardContextMenuPoint } from '../../components/contextMenuPosition'
import { useConfirmation } from '../../hooks/useConfirmation'
import { usePocketBase } from '../../lib/contexts'
import { Avatar } from '../members/Avatar'
import { MemberContextMenuItems } from '../members/MemberContextMenuItems'
import type { MemberInteractions } from '../members/memberInteractions'
import { useCall, useParticipantSpeaking } from '../calls/CallProvider'
import { loadJitsiEngine } from '../calls/jitsiEngine'
import { mergeCallParticipants } from '../calls/participantSync'
import { CallDock } from '../calls/CallSurface'
import { channelCallTarget, participantBelongsToTarget, sameCallTarget } from '../calls/targets'
import type { CallParticipant } from '../calls/types'

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || '?'
}

export function ChannelIcon({ kind }: { readonly kind: Channel['kind'] }) {
  if (kind === 'voice') return <Volume2 size={17} />
  if (kind === 'announcement') return <Megaphone size={17} />
  return <Hash size={17} />
}

export function ChannelSidebar({
  community,
  channels,
  activeChannelId,
  currentUser,
  currentStatus,
  onSelect,
  onCreate,
  onCategorySettings,
  onSettings,
  onProfile,
  onOpenVoice,
  unreadChannelIds,
  permissions: effectivePermissions,
  voiceOccupancy,
  memberInteractions,
  hasMore,
  loadingMore,
  onLoadMore,
}: {
  readonly community: Community
  readonly channels: Channel[]
  readonly activeChannelId: string
  readonly currentUser: User
  readonly currentStatus: User['status']
  readonly onSelect: (channel: Channel) => void
  readonly onCreate: (parent: string) => void
  readonly onCategorySettings: (category: Channel) => void
  readonly onSettings: () => void
  readonly onProfile: () => void
  readonly onOpenVoice: (target: CallTargetDescriptor) => void
  readonly unreadChannelIds: ReadonlySet<string>
  readonly permissions: ReadonlySet<Permission>
  readonly voiceOccupancy: readonly CallParticipantRecord[]
  readonly memberInteractions: MemberInteractions
  readonly hasMore: boolean
  readonly loadingMore: boolean
  readonly onLoadMore: () => void
}) {
  const call = useCall()
  const client = usePocketBase()
  const bannerUrl = community.banner
    ? client.files.getURL(community as unknown as RecordModel, community.banner, { thumb: '640x180' })
    : ''
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set())
  const categories = channels.filter((channel) => channel.kind === 'category')
  const categoryIds = new Set(categories.map((category) => category.id))
  const uncategorized = channels.filter((channel) => (
    channel.kind !== 'category' && (!channel.parent || !categoryIds.has(channel.parent))
  ))
  return (
    <aside
      id="community-navigation"
      className="channel-sidebar"
      aria-label={`${community.name} channels`}
    >
      <div className="community-header">
        <span><strong>{community.name}</strong></span>
        <button type="button" onClick={onSettings} title="Community settings"><Settings size={16} /></button>
      </div>
      {bannerUrl ? (
        <img
          className="community-banner"
          src={bannerUrl}
          alt=""
          width="640"
          height="180"
          decoding="async"
        />
      ) : null}
      <div className="channel-scroll">
        {uncategorized.map((channel) => (
          <ChannelButton channel={channel} occupants={voiceOccupancy} active={channel.id === activeChannelId} unread={unreadChannelIds.has(channel.id)} onSelect={onSelect} permissions={effectivePermissions} memberInteractions={memberInteractions} key={channel.id} />
        ))}
        {categories.map((category) => (
          <section className="channel-category" key={category.id}>
            <div className="category-heading">
              <button
                type="button"
                aria-expanded={!collapsed.has(category.id)}
                aria-controls={`category-${category.id}-channels`}
                onClick={() => setCollapsed((current) => {
                const next = new Set(current)
                if (next.has(category.id)) next.delete(category.id)
                else next.add(category.id)
                return next
              })}><ChevronDown className={collapsed.has(category.id) ? 'collapsed' : ''} size={13} />{category.name}</button>
              {effectivePermissions.has('manage_channels') ? (
                <span className="category-actions">
                  <button type="button" title={`Category settings for ${category.name}`} onClick={() => onCategorySettings(category)}><Settings size={13} /></button>
                  <button type="button" title={`Create channel in ${category.name}`} onClick={() => onCreate(category.id)}><Plus size={14} /></button>
                </span>
              ) : null}
            </div>
            <div id={`category-${category.id}-channels`} className="category-channels">
              {!collapsed.has(category.id) ? channels.flatMap((channel) => (
                channel.parent === category.id
                  ? [<ChannelButton channel={channel} occupants={voiceOccupancy} active={channel.id === activeChannelId} unread={unreadChannelIds.has(channel.id)} onSelect={onSelect} permissions={effectivePermissions} memberInteractions={memberInteractions} key={channel.id} />]
                  : []
              )) : null}
            </div>
          </section>
        ))}
        {hasMore ? <button className="secondary-action sidebar-load-more" type="button" disabled={loadingMore} onClick={onLoadMore}>{loadingMore ? 'Loading…' : 'Load more channels'}</button> : null}
      </div>
      <div className="sidebar-footer">
        <CallDock onOpen={onOpenVoice} />
        <div className="user-panel">
          <Avatar user={currentUser} size="small" status={currentStatus} />
          <div className="user-panel-copy"><strong>{currentUser.displayName}</strong><small>@{currentUser.handle}</small></div>
          <button className={call.microphoneMuted ? 'active' : ''} type="button" disabled={Boolean(call.session && (call.session.actionBusy || !call.session.canSpeak))} title={call.session ? !call.session.canSpeak ? 'You do not have permission to speak' : call.microphoneMuted ? 'Unmute' : 'Mute' : call.microphoneMuted ? 'Unmute before joining' : 'Mute before joining'} onClick={() => void call.toggleMicrophone()}>
            {call.microphoneMuted ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          <button className={call.deafened ? 'active' : ''} type="button" disabled={Boolean(call.session?.actionBusy)} title={call.deafened ? 'Undeafen' : call.session ? 'Deafen' : 'Deafen before joining'} onClick={() => void call.toggleDeafen()}>
            <Headphones size={16} />
          </button>
          <button type="button" title="User settings" onClick={onProfile}><Settings size={16} /></button>
        </div>
      </div>
    </aside>
  )
}

function VoiceParticipantRow({
  participant,
  channel,
  target,
  onSelect,
  permissions,
  interactions,
}: {
  readonly participant: CallParticipant
  readonly channel: Channel
  readonly target: CallTargetDescriptor
  readonly onSelect: (channel: Channel) => void
  readonly permissions: ReadonlySet<Permission>
  readonly interactions: MemberInteractions
}) {
  const call = useCall()
  const speaking = useParticipantSpeaking(participant.id)
  const [menuPoint, setMenuPoint] = useState<ContextMenuPoint | null>(null)
  const { confirm, confirmation } = useConfirmation()
  const longPressTimer = useRef<number | undefined>(undefined)
  const longPressStart = useRef({ x: 0, y: 0 })
  const suppressNextClick = useRef(false)
  const membership = interactions.memberships?.find(
    (item) => item.user === participant.userId,
  )
  const user = participant.user ?? membership?.expand?.user
  const isCurrentUser = participant.userId === interactions.currentUserId
  const canModerateHierarchy = Boolean(
    !isCurrentUser && interactions.canModerateUser?.(participant.userId),
  )
  const moderatingCurrentCall = Boolean(
    call.session && sameCallTarget(call.session.target.target, target.target),
  )
  const canServerMute = moderatingCurrentCall
    ? Boolean(call.session?.canMuteMembers)
    : permissions.has('mute_members')
  const canDisconnect = moderatingCurrentCall
    ? Boolean(call.session?.canRemoveMembers)
    : permissions.has('manage_members')
  const remoteAudio = !participant.local && participant.audioTrack
    ? call.remoteAudioFor(participant.userId)
    : undefined

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current !== undefined) {
      window.clearTimeout(longPressTimer.current)
      longPressTimer.current = undefined
    }
  }, [])

  useEffect(() => clearLongPress, [clearLongPress])

  const startLongPress = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== 'touch') return
    clearLongPress()
    longPressStart.current = { x: event.clientX, y: event.clientY }
    longPressTimer.current = window.setTimeout(() => {
      suppressNextClick.current = true
      setMenuPoint({ x: event.clientX, y: event.clientY })
      longPressTimer.current = undefined
    }, CONTEXT_MENU_LONG_PRESS_MS)
  }

  const moveLongPress = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== 'touch' || longPressTimer.current === undefined) return
    if (contextMenuLongPressMoved(longPressStart.current, {
      x: event.clientX,
      y: event.clientY,
    })) {
      clearLongPress()
    }
  }

  const openMenu = (point: ContextMenuPoint) => {
    clearLongPress()
    setMenuPoint(point)
  }

  return (
    <div className="voice-member-row-wrap">
      <button
        className="voice-member-row"
        type="button"
        onClick={(event) => {
          if (suppressNextClick.current) {
            suppressNextClick.current = false
            event.preventDefault()
            return
          }
          onSelect(channel)
        }}
        onContextMenu={(event) => {
          event.preventDefault()
          openMenu({ x: event.clientX, y: event.clientY })
        }}
        onKeyDown={(event) => {
          const point = keyboardContextMenuPoint(event)
          if (point) openMenu(point)
        }}
        onPointerDown={startLongPress}
        onPointerMove={moveLongPress}
        onPointerUp={clearLongPress}
        onPointerCancel={clearLongPress}
        onPointerLeave={clearLongPress}
      >
        <span className={`voice-member-avatar ${speaking ? 'speaking' : ''}`}>{initials(participant.name)}</span>
        <span>{participant.name}</span>
        {participant.serverMuted || participant.muted ? <MicOff size={12} /> : null}
      </button>
      <button
        className="voice-member-context-trigger"
        type="button"
        title={`More actions for ${participant.name}`}
        aria-label={`More actions for ${participant.name}`}
        onClick={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect()
          openMenu({ x: bounds.right, y: bounds.bottom })
        }}
      ><MoreVertical size={13} /></button>
      {menuPoint ? (
        <ContextMenu
          point={menuPoint}
          label={`Actions for ${participant.name}`}
          onClose={() => setMenuPoint(null)}
        >
          <MemberContextMenuItems
            user={user}
            membership={membership}
            currentUserId={interactions.currentUserId}
            onOpenProfile={user ? () => interactions.onOpenProfile(user) : undefined}
            onMessage={user ? () => interactions.onMessage(user) : undefined}
            localAudio={remoteAudio
              ? {
                  muted: remoteAudio.muted,
                  volume: remoteAudio.volume,
                  onMutedChange: (muted) => call.setRemoteUserMuted(participant.userId, muted),
                  onVolumeChange: (volume) => call.setRemoteUserVolume(participant.userId, volume),
                }
              : undefined}
            callModeration={canModerateHierarchy && (canServerMute || canDisconnect)
              ? {
                  serverMuted: participant.serverMuted,
                  canServerMute,
                  canDisconnect,
                  onServerMuteChange: (serverMuted) => void call.moderateParticipant(
                    participant.userId,
                    serverMuted ? 'server_mute' : 'server_unmute',
                    target.target,
                  ),
                  onDisconnect: () => {
                    void confirm({
                      title: 'Disconnect participant?',
                      description: `Disconnect ${participant.name} from this call? They can rejoin if they still have access.`,
                      confirmLabel: 'Disconnect participant',
                    }).then((confirmed) => {
                      if (confirmed) {
                        void call.moderateParticipant(participant.userId, 'kick', target.target)
                      }
                    })
                  },
                }
              : undefined}
            communityModeration={
              membership
              && interactions.canManageMembers
              && canModerateHierarchy
              && interactions.onModerate
                ? {
                    onAction: (action) => interactions.onModerate?.(membership, action),
                  }
                : undefined
            }
          />
        </ContextMenu>
      ) : null}
      {confirmation}
    </div>
  )
}

function ChannelButton({
  channel,
  active,
  unread,
  onSelect,
  occupants,
  permissions,
  memberInteractions,
}: {
  readonly channel: Channel
  readonly active: boolean
  readonly unread: boolean
  readonly onSelect: (channel: Channel) => void
  readonly occupants: readonly CallParticipantRecord[]
  readonly permissions: ReadonlySet<Permission>
  readonly memberInteractions: MemberInteractions
}) {
  const call = useCall()
  const target = channelCallTarget(channel)
  const sharedParticipants = occupants.filter((participant) => (
    participantBelongsToTarget(participant, target.target)
  ))
  const liveParticipants = call.session && sameCallTarget(call.session.target.target, target.target)
    ? call.session.participants
    : []
  const callParticipants = mergeCallParticipants(liveParticipants, sharedParticipants, target.target)
  return (
    <>
      <button
        className={`channel-row ${active ? 'active' : ''} ${unread ? 'unread' : ''} ${callParticipants.length ? 'connected' : ''}`}
        type="button"
        aria-current={active ? 'page' : undefined}
        onPointerEnter={channel.kind === 'voice' ? () => void loadJitsiEngine().catch(() => undefined) : undefined}
        onPointerDown={channel.kind === 'voice' ? () => void loadJitsiEngine().catch(() => undefined) : undefined}
        onFocus={channel.kind === 'voice' ? () => void loadJitsiEngine().catch(() => undefined) : undefined}
        onClick={() => onSelect(channel)}
      >
        <ChannelIcon kind={channel.kind} />
        <span className="channel-name">{channel.name}</span>
        {unread ? <span className="visually-hidden">Unread</span> : null}
      </button>
      {callParticipants.length ? (
        <div className="voice-member-list">
          {callParticipants.map((participant) => (
            <VoiceParticipantRow
              participant={participant}
              channel={channel}
              target={target}
              onSelect={onSelect}
              permissions={permissions}
              interactions={memberInteractions}
              key={participant.id}
            />
          ))}
        </div>
      ) : null}
    </>
  )
}
