import type { CallParticipantRecord, CallTargetDescriptor, Conversation, ConversationMember, User } from '@thiscord/shared'
import { Headphones, Mic, MicOff, PhoneCall, Plus, Settings } from 'lucide-react'
import { CallDock } from '../calls/CallSurface'
import { useCall } from '../calls/CallProvider'
import { conversationCallTarget, participantBelongsToTarget } from '../calls/targets'
import { Avatar } from '../members/Avatar'

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || '?'
}

export function DirectSidebar({
  conversations,
  members,
  unreadConversationIds,
  activeId,
  currentUser,
  currentStatus,
  onSelect,
  onCreate,
  onProfile,
  onOpenVoice,
  callOccupancy,
  hasMore,
  loadingMore,
  onLoadMore,
}: {
  readonly conversations: Conversation[]
  readonly members: ConversationMember[]
  readonly unreadConversationIds: ReadonlySet<string>
  readonly activeId: string
  readonly currentUser: User
  readonly currentStatus: User['status']
  readonly onSelect: (conversation: Conversation) => void
  readonly onCreate: () => void
  readonly onProfile: () => void
  readonly onOpenVoice: (target: CallTargetDescriptor) => void
  readonly callOccupancy: readonly CallParticipantRecord[]
  readonly hasMore: boolean
  readonly loadingMore: boolean
  readonly onLoadMore: () => void
}) {
  const call = useCall()
  const nameFor = (conversation: Conversation) => {
    if (conversation.kind === 'group') return conversation.name
    return members.find((item) => (
      item.conversation === conversation.id && item.user !== currentUser.id
    ))?.expand?.user?.displayName ?? 'Direct message'
  }
  return (
    <aside
      id="community-navigation"
      className="channel-sidebar direct-sidebar"
      aria-label="Direct messages navigation"
    >
      <div className="community-header direct-header"><strong>Messages</strong><button type="button" onClick={onCreate} title="New message"><Plus size={17} /></button></div>
      <div className="channel-scroll">
        {conversations.map((conversation) => {
          const target = conversationCallTarget(conversation, members, currentUser.id)
          const name = nameFor(conversation)
          const unread = conversation.id !== activeId && unreadConversationIds.has(conversation.id)
          const participantCount = callOccupancy.filter((participant) => (
            participantBelongsToTarget(participant, target.target)
          )).length
          return (
          <button className={`direct-row ${conversation.id === activeId ? 'active' : ''} ${unread ? 'unread' : ''}`} type="button" aria-current={conversation.id === activeId ? 'page' : undefined} onClick={() => onSelect(conversation)} key={conversation.id}>
            <span className="direct-avatar" aria-hidden="true">{initials(name)}</span>
            <span><strong>{name}</strong><small>{conversation.kind === 'group' ? 'Group message' : 'Direct message'}</small></span>
            {participantCount ? <span className="direct-call-presence" title={`${participantCount} in call`}><PhoneCall size={12} />{participantCount}</span> : null}
            {unread ? <span className="visually-hidden">Unread</span> : null}
          </button>
          )
        })}
        {hasMore ? <button className="secondary-action sidebar-load-more" type="button" disabled={loadingMore} onClick={onLoadMore}>{loadingMore ? 'Loading…' : 'Load more conversations'}</button> : null}
        {!conversations.length ? <div className="sidebar-empty">No conversations yet.</div> : null}
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
          <button type="button" onClick={onProfile} title="User settings"><Settings size={16} /></button>
        </div>
      </div>
    </aside>
  )
}
