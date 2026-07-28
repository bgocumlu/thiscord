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
  Plus,
  Settings,
  Volume2,
} from 'lucide-react'
import type { RecordModel } from 'pocketbase'
import { useState } from 'react'
import { usePocketBase } from '../../lib/contexts'
import { Avatar } from '../members/Avatar'
import { useCall } from '../calls/CallProvider'
import { mergeCallParticipants } from '../calls/participantSync'
import { CallDock } from '../calls/CallSurface'
import { channelCallTarget, participantBelongsToTarget, sameCallTarget } from '../calls/targets'

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
    <aside className="channel-sidebar">
      <div className="community-header">
        <span><strong>{community.name}</strong></span>
        <button type="button" onClick={onSettings} title="Community settings"><Settings size={16} /></button>
      </div>
      {bannerUrl ? <img className="community-banner" src={bannerUrl} alt="" /> : null}
      <div className="channel-scroll">
        {uncategorized.map((channel) => (
          <ChannelButton channel={channel} occupants={voiceOccupancy} active={channel.id === activeChannelId} unread={unreadChannelIds.has(channel.id)} onSelect={onSelect} key={channel.id} />
        ))}
        {categories.map((category) => (
          <section className="channel-category" key={category.id}>
            <div className="category-heading">
              <button type="button" aria-expanded={!collapsed.has(category.id)} onClick={() => setCollapsed((current) => {
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
            {!collapsed.has(category.id) ? channels.filter((channel) => channel.parent === category.id).map((channel) => (
              <ChannelButton channel={channel} occupants={voiceOccupancy} active={channel.id === activeChannelId} unread={unreadChannelIds.has(channel.id)} onSelect={onSelect} key={channel.id} />
            )) : null}
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

function ChannelButton({ channel, active, unread, onSelect, occupants }: {
  readonly channel: Channel
  readonly active: boolean
  readonly unread: boolean
  readonly onSelect: (channel: Channel) => void
  readonly occupants: readonly CallParticipantRecord[]
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
      <button className={`channel-row ${active ? 'active' : ''} ${unread ? 'unread' : ''} ${callParticipants.length ? 'connected' : ''}`} type="button" onClick={() => onSelect(channel)}>
        <ChannelIcon kind={channel.kind} />
        <span className="channel-name">{channel.name}</span>
      </button>
      {callParticipants.length ? (
        <div className="voice-member-list">
          {callParticipants.map((participant) => (
            <button type="button" onClick={() => onSelect(channel)} key={participant.id}>
              <span className={`voice-member-avatar ${participant.speaking ? 'speaking' : ''}`}>{initials(participant.name)}</span>
              <span>{participant.name}</span>
              {participant.muted ? <MicOff size={12} /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </>
  )
}
