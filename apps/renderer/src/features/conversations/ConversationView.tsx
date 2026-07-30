import { t } from '../../lib/i18n'
import type {
  CallParticipantRecord,
  CallTargetDescriptor,
  Conversation,
  ConversationMember,
  User,
} from '@thiscord/shared'
import { useQueryClient } from '@tanstack/react-query'
import {
  Bell,
  BellOff,
  Menu,
  MessageSquareText,
  Phone,
  Settings,
} from 'lucide-react'
import { lazy, Suspense, useMemo, useState } from 'react'
import { LoadingState } from '../../components/WorkspacePrimitives'
import { initials } from '../../components/workspaceUtils'
import { usePocketBase } from '../../lib/contexts'
import { loadJitsiEngine } from '../calls/jitsiEngine'
import { useAppRouter } from '../../lib/router'
import { CallSurface } from '../calls/CallSurface'
import { Avatar } from '../members/Avatar'
import type { MemberInteractions } from '../members/memberInteractions'
import { participantBelongsToTarget } from '../calls/targets'
import { MessageSurface } from '../messaging/MessageSurface'
import { conversationKeys } from './queryKeys'
import { createConversationMessageAdapter } from './conversationMessageAdapter'
import {
  useDirectMessages,
} from './queries'

const GroupSettingsDialog = lazy(() => import('./ConversationDialogs').then((module) => ({
  default: module.GroupSettingsDialog,
})))

export function ConversationView({
  conversation,
  members,
  currentUser,
  callTarget,
  callOccupancy,
  callActive,
  muted,
  navigationOpen,
  onStartCall,
  onToggleMute,
  onOpenNavigation,
  memberInteractions,
}: {
  readonly conversation: Conversation | null
  readonly members: ConversationMember[]
  readonly currentUser: User
  readonly callTarget: CallTargetDescriptor | null
  readonly callOccupancy: readonly CallParticipantRecord[]
  readonly callActive: boolean
  readonly muted: boolean
  readonly navigationOpen: boolean
  readonly onStartCall: (target: CallTargetDescriptor) => void
  readonly onToggleMute: () => void
  readonly onOpenNavigation: () => void
  readonly memberInteractions: MemberInteractions
}) {
  const client = usePocketBase()
  const queryClient = useQueryClient()
  const { search } = useAppRouter()
  const messages = useDirectMessages(conversation?.id ?? '')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const conversationMembers = useMemo(
    () => members.filter((item) => item.conversation === conversation?.id),
    [conversation?.id, members],
  )
  const ownMembership = conversationMembers.find((item) => item.user === currentUser.id)
  const recipient = conversation?.kind === 'direct'
    ? conversationMembers.find((item) => item.user !== currentUser.id)?.expand?.user
    : undefined
  const adapter = useMemo(
    () => conversation && ownMembership
      ? createConversationMessageAdapter({
          client,
          queryClient,
          conversation,
          membership: ownMembership,
        })
      : null,
    [client, conversation, ownMembership, queryClient],
  )
  const title = conversation?.kind === 'group'
    ? conversation.name
    : recipient?.displayName ?? t("conversations.view.directMessage")
  const callParticipantCount = callTarget
    ? callOccupancy.filter((participant) => participantBelongsToTarget(participant, callTarget.target)).length
    : 0
  const highlightedMessageId = new URLSearchParams(search).get('directMessage') ?? ''

  if (!conversation) {
    return (
      <div className="direct-empty">
        <button
          className="mobile-nav-button"
          type="button"
          aria-label={t("conversations.view.openMessagesNavigation")}
          aria-expanded={navigationOpen}
          aria-controls="community-navigation"
          onClick={onOpenNavigation}
        ><Menu size={18} /></button>
        <div className="direct-empty-content">
          <MessageSquareText size={34} />
          <h1>{t("conversations.view.yourMessages")}</h1>
          <p>{t("conversations.view.selectAConversationOrStartANewOne")}</p>
        </div>
      </div>
    )
  }
  if (!adapter) return <LoadingState>{t("conversations.view.loadingConversationMembership")}</LoadingState>

  return (
    <div className="direct-view">
      <header className="direct-view-header">
        <button
          className="mobile-nav-button"
          type="button"
          aria-label={t("conversations.view.openMessagesNavigation")}
          aria-expanded={navigationOpen}
          aria-controls="community-navigation"
          onClick={onOpenNavigation}
        ><Menu size={18} /></button>
        {recipient
          ? <Avatar user={recipient} />
          : <span className="conversation-header-avatar">{initials(title)}</span>}
        <span className="direct-view-title">
          <strong title={title}>{title}</strong>
          <small>
            {callParticipantCount
              ? t("conversations.view.membersParticipants", {
                members: t("common.memberCount", { count: conversationMembers.length }),
                participants: t("calls.participantCount", { count: callParticipantCount }),
              })
              : t("common.memberCount", { count: conversationMembers.length })}
          </small>
        </span>
        <button
          type="button"
          title={muted ? t("conversations.view.unmuteCallNotifications") : t("conversations.view.muteCallNotifications")}
          aria-label={muted ? t("conversations.view.unmuteConversationCallNotifications") : t("conversations.view.muteConversationCallNotifications")}
          onClick={onToggleMute}
        >{muted ? <BellOff size={17} /> : <Bell size={17} />}</button>
        <button
          className={callParticipantCount ? 'active' : ''}
          type="button"
          title={callParticipantCount ? t("conversations.view.joinCall") : t("conversations.view.startCall")}
          aria-label={callParticipantCount
            ? t("calls.joinParticipantCount", { count: callParticipantCount })
            : t("conversations.view.startCall")}
          onPointerEnter={() => void loadJitsiEngine().catch(() => undefined)}
          onPointerDown={() => void loadJitsiEngine().catch(() => undefined)}
          onFocus={() => void loadJitsiEngine().catch(() => undefined)}
          onClick={() => {
            if (callTarget) onStartCall(callTarget)
          }}
        ><Phone size={17} /></button>
        {conversation.kind === 'group' ? (
          <button type="button" aria-label={t("conversations.view.groupSettings")} onClick={() => setSettingsOpen(true)}>
            <Settings size={17} />
          </button>
        ) : null}
      </header>
      {callActive && callTarget ? (
        <CallSurface
          target={callTarget}
          occupancy={callOccupancy}
          description={t("common.memberCount", { count: conversationMembers.length })}
          presentation="conversation"
          memberInteractions={memberInteractions}
        />
      ) : null}
      <MessageSurface
        key={conversation.id}
        adapter={adapter}
        history={messages}
        currentUser={currentUser}
        onOpenProfile={memberInteractions.onOpenProfile}
        intro={(
          <div className="channel-intro">
            <span><MessageSquareText size={24} /></span>
            <small className="channel-intro-kicker">
              {conversation.kind === 'group' ? t("conversations.view.groupConversation") : t("conversations.view.directConversation")}
            </small>
            <h1>{title}</h1>
          </div>
        )}
        placeholder={t("conversations.view.messageConversation", { conversationName: title })}
        searchLabel={t("conversations.view.searchConversation", { conversationName: title })}
        highlightedMessageId={highlightedMessageId}
        messageElementPrefix="direct-message-"
        emptyTitle={t("conversations.view.noMessagesYet")}
        emptyDescription={t("conversations.view.sendTheFirstMessageInThisConversation")}
        searchErrorLabel={t("conversations.view.couldNotSearchThisConversation")}
        historyErrorLabel={t("conversations.view.couldNotLoadThisConversation")}
        className="direct-message-surface"
      />
      {settingsOpen ? (
        <Suspense fallback={<div className="modal-loading" role="status">{t("conversations.view.openingDialog")}</div>}>
          <GroupSettingsDialog
            conversation={conversation}
            members={conversationMembers}
            currentUser={currentUser}
            onClose={() => setSettingsOpen(false)}
            onChanged={async () => {
              await Promise.all([
                queryClient.invalidateQueries({ queryKey: conversationKeys.all }),
                queryClient.invalidateQueries({ queryKey: conversationKeys.members }),
              ])
            }}
          />
        </Suspense>
      ) : null}
    </div>
  )
}
