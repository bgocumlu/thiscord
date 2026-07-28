import type { Channel, Community, User } from '@thiscord/shared'
import { useQueryClient } from '@tanstack/react-query'
import {
  Bell,
  BellOff,
  Menu,
  Settings,
  Users,
  X,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useAuth } from '../auth/AuthProvider'
import { useRealtimeInvalidation } from '../hooks/useRealtimeInvalidation'
import { useRuntimeConfig } from '../lib/contexts'
import { errorMessage, requestWasDeniedOrMissing } from '../lib/pocketbase'
import { useAppRouter } from '../lib/router'
import { useCall } from '../features/calls/CallProvider'
import { VoiceChannelSurface } from '../features/calls/CallSurface'
import { useCallOccupancy } from '../features/calls/queries'
import {
  channelCallTarget,
  conversationCallTarget,
  sameCallTarget,
} from '../features/calls/targets'
import { useCallNavigation } from '../features/calls/useCallNavigation'
import { ChannelIcon, ChannelSidebar } from '../features/channels/ChannelSidebar'
import {
  useChannelTarget,
  useCommunityChannels,
  useEffectivePermissions,
} from '../features/channels/queries'
import { channelKeys } from '../features/channels/queryKeys'
import { useChannelMute } from '../features/channels/useChannelMute'
import {
  ChannelDialog,
  ChannelSettingsDialog,
} from '../features/channels/ChannelDialogs'
import { CommunityRail } from '../features/communities/CommunityRail'
import { CommunityDialog } from '../features/communities/CommunityDialog'
import { CommunitySettingsDialog } from '../features/communities/CommunitySettingsDialog'
import { communityKeys } from '../features/communities/queryKeys'
import { useMemberships } from '../features/communities/queries'
import { DirectSidebar } from '../features/conversations/DirectSidebar'
import { conversationKeys } from '../features/conversations/queryKeys'
import {
  useConversations,
  useConversationTarget,
} from '../features/conversations/queries'
import { ConversationView } from '../features/conversations/ConversationView'
import { DirectDialog } from '../features/conversations/ConversationDialogs'
import { useConversationMute } from '../features/conversations/useConversationMute'
import { useOpenDirectConversation } from '../features/conversations/useOpenDirectConversation'
import { ChannelMessageView } from '../features/messaging/ChannelMessageView'
import { MembersPanel } from '../features/members/MembersPanel'
import {
  MemberProfileDialog,
  ProfileDialog,
} from '../features/members/ProfileDialogs'
import { useCommunityMembers } from '../features/members/queries'
import { memberKeys } from '../features/members/queryKeys'
import { usePresenceLifecycle } from '../features/members/usePresenceLifecycle'
import { useUserAppearance } from '../features/members/useUserAppearance'
import { useUnreadSummary } from '../features/messaging/queries'
import { appRoutes, parseAppRoute } from '../features/navigation/routes'
import { includeRouteTarget } from '../features/navigation/routeTargets'
import { Inbox } from '../features/notifications/Inbox'
import { roleKeys } from '../features/roles/queryKeys'
import { useCommunityRoles } from '../features/roles/queries'
import { GlobalSearch } from '../features/search/GlobalSearch'
import { DataFailure, resolvedPresence } from './WorkspacePrimitives'

type Modal =
  | { readonly kind: 'community' }
  | { readonly kind: 'channel'; readonly parent: string }
  | { readonly kind: 'channelSettings'; readonly channel: Channel }
  | { readonly kind: 'settings' }
  | { readonly kind: 'profile' }
  | { readonly kind: 'member'; readonly user: User }
  | { readonly kind: 'direct' }
  | null

export function WorkspaceApp() {
  const { pathname, navigate } = useAppRouter()
  const route = parseAppRoute(pathname)
  const communityId = route.kind === 'channel' ? route.communityId : ''
  const channelId = route.kind === 'channel'
    ? route.channelId
    : route.kind === 'conversations'
      ? route.conversationId
      : ''
  const config = useRuntimeConfig()
  const queryClient = useQueryClient()
  const { user, logout } = useAuth()
  const call = useCall()
  const currentUser = user!
  useUserAppearance(currentUser.preferences)
  const memberships = useMemberships(currentUser.id)
  const communities = (memberships.data ?? []).map((membership) => membership.expand?.community).filter(Boolean) as Community[]
  const community = communities.find((item) => item.id === communityId)
  const channelsData = useCommunityChannels(community?.id ?? '')
  const memberData = useCommunityMembers(community?.id ?? '')
  const rolesData = useCommunityRoles(community?.id ?? '')
  const unreadSummary = useUnreadSummary(community?.id ?? '')
  const communityData = {
    channels: channelsData,
    members: memberData.members,
    roles: rolesData,
    memberRoles: memberData.memberRoles,
    presence: memberData.presence,
    unreadSummary,
  }
  const conversationsData = useConversations(currentUser.id)
  const listedConversations = useMemo(
    () => conversationsData.conversations.data ?? [],
    [conversationsData.conversations.data],
  )
  const listedConversationMembers = useMemo(
    () => conversationsData.members.data ?? [],
    [conversationsData.members.data],
  )
  const listedActiveConversation = listedConversations.find((item) => item.id === channelId) ?? null
  const conversationTarget = useConversationTarget(
    channelId,
    route.kind === 'conversations' && Boolean(channelId) && !listedActiveConversation,
  )
  const conversations = useMemo(
    () => includeRouteTarget(listedConversations, conversationTarget.data?.conversation),
    [conversationTarget.data?.conversation, listedConversations],
  )
  const conversationMembers = useMemo(
    () => {
      const targetMembers = conversationTarget.data?.members ?? []
      return targetMembers.reduce(
        (items, member) => includeRouteTarget(items, member),
        [...listedConversationMembers],
      )
    },
    [conversationTarget.data?.members, listedConversationMembers],
  )
  const activeConversation = conversations.find((item) => item.id === channelId) ?? null
  const listedChannels = useMemo(() => communityData.channels.data ?? [], [communityData.channels.data])
  const listedActiveChannel = listedChannels.find((item) => item.id === channelId) ?? null
  const channelTarget = useChannelTarget(
    channelId,
    route.kind === 'channel' && Boolean(community) && Boolean(channelId) && !listedActiveChannel,
  )
  const routeChannel = channelTarget.data?.community === community?.id ? channelTarget.data : null
  const channels = useMemo(
    () => includeRouteTarget(listedChannels, routeChannel),
    [listedChannels, routeChannel],
  )
  const channelCallTargets = useMemo(
    () => channels.filter((channel) => channel.kind === 'voice').map(channelCallTarget),
    [channels],
  )
  const conversationCallTargets = useMemo(
    () => conversations.map((conversation) => (
      conversationCallTarget(conversation, conversationMembers, currentUser.id)
    )),
    [conversationMembers, conversations, currentUser.id],
  )
  const callTargets = useMemo(
    () => {
      const targets = [...channelCallTargets, ...conversationCallTargets]
      const activeCallTarget = call.session?.target
      if (
        activeCallTarget
        && !targets.some((candidate) => sameCallTarget(candidate.target, activeCallTarget.target))
      ) targets.push(activeCallTarget)
      return targets
    },
    [call.session?.target, channelCallTargets, conversationCallTargets],
  )
  const activeConversationCallTarget = activeConversation
    ? conversationCallTargets.find((descriptor) => descriptor.target.id === activeConversation.id) ?? null
    : null
  const callTargetReferences = useMemo(
    () => callTargets.map((descriptor) => descriptor.target),
    [callTargets],
  )
  const callOccupancy = useCallOccupancy(callTargetReferences)
  const activeChannel = channels.find((item) => item.id === channelId && item.kind !== 'category')
  const communityPermissionQuery = useEffectivePermissions(community?.id ?? '')
  const channelPermissionQuery = useEffectivePermissions(community?.id ?? '', activeChannel?.id ?? '')
  const communityPermissions = useMemo(
    () => new Set(communityPermissionQuery.data?.permissions ?? []),
    [communityPermissionQuery.data?.permissions],
  )
  const channelPermissions = useMemo(
    () => new Set(channelPermissionQuery.data?.permissions ?? []),
    [channelPermissionQuery.data?.permissions],
  )
  const [showMembers, setShowMembers] = useState(true)
  const [modal, setModal] = useState<Modal>(null)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [acknowledgedNsfw, setAcknowledgedNsfw] = useState<ReadonlySet<string>>(() => {
    try {
      return new Set(JSON.parse(sessionStorage.getItem('thiscord_nsfw_ack') ?? '[]') as string[])
    } catch {
      return new Set()
    }
  })
  const presence = usePresenceLifecycle(
    currentUser,
    Boolean(call.session && call.session.status !== 'error'),
  )
  const visiblePresence = useMemo(() => {
    const records = (communityData.presence.data ?? [])
      .filter((item) => item.user !== currentUser.id)
    return presence.status === 'offline'
      ? records
      : [...records, {
          id: `self:${currentUser.id}`,
          user: currentUser.id,
          status: presence.status,
        }]
  }, [communityData.presence.data, currentUser.id, presence.status])
  const signOut = useCallback(async () => {
    await call.leave()
    await presence.close()
    logout()
  }, [call, logout, presence])
  const realtimeStatus = useRealtimeInvalidation({
    enabled: true,
    userId: currentUser.id,
    communityId: community?.id ?? '',
  })
  const channelMute = useChannelMute(currentUser, activeChannel)
  const conversationMute = useConversationMute(currentUser, activeConversation)
  const directConversation = useOpenDirectConversation()
  const closeMobileNavigation = useCallback(() => setMobileSidebarOpen(false), [])
  const callNavigation = useCallNavigation({
    targets: callTargets,
    occupancy: callOccupancy.data ?? [],
    activeChannel,
    userId: currentUser.id,
    onNavigationClosed: closeMobileNavigation,
  })

  useEffect(() => {
    if (!community || route.kind !== 'channel' || activeChannel) return
    if (channelId) {
      if (channelTarget.isPending || channelTarget.isFetching) return
      if (
        !channelTarget.isSuccess
        && !requestWasDeniedOrMissing(channelTarget.error)
      ) return
    }
    const first = listedChannels.find((item) => item.kind !== 'category')
    if (first) navigate(appRoutes.channel(community.id, first.id), { replace: true })
  }, [
    activeChannel,
    channelId,
    channelTarget.error,
    channelTarget.isFetching,
    channelTarget.isPending,
    channelTarget.isSuccess,
    community,
    listedChannels,
    navigate,
    route.kind,
  ])

  const selectCommunity = (next: Community) => {
    const first = (next.id === community?.id ? channels : []).find((item) => item.kind !== 'category')
    navigate(appRoutes.channel(next.id, first?.id))
  }

  const unreadChannelIds = new Set<string>(
    (communityData.unreadSummary.data?.items ?? [])
      .filter((item) => {
        if (item.author === currentUser.id || item.channel === activeChannel?.id) return false
        return true
      })
      .map((item) => item.channel),
  )
  const actionError = channelMute.error || conversationMute.error || directConversation.error
  const clearActionError = () => {
    channelMute.clearError()
    conversationMute.clearError()
    directConversation.clearError()
  }

  if (memberships.isError) {
    return <main className="fatal-startup"><section><h1>Could not load your communities</h1><p>{errorMessage(memberships.error)}</p><button className="primary-action" type="button" onClick={() => void memberships.refetch()}>Try again</button></section></main>
  }
  const backgroundFailure = channelTarget.isError && !requestWasDeniedOrMissing(channelTarget.error)
    ? { label: 'Could not load the linked channel.', error: channelTarget.error, retry: channelTarget.refetch }
    : conversationTarget.isError
      ? { label: 'Could not load the linked conversation.', error: conversationTarget.error, retry: conversationTarget.refetch }
      : communityPermissionQuery.isError
        ? { label: 'Could not load your community permissions.', error: communityPermissionQuery.error, retry: communityPermissionQuery.refetch }
        : channelPermissionQuery.isError
      ? { label: 'Could not load this channel’s permissions.', error: channelPermissionQuery.error, retry: channelPermissionQuery.refetch }
      : communityData.unreadSummary.isError
        ? { label: 'Could not refresh unread channels.', error: communityData.unreadSummary.error, retry: communityData.unreadSummary.refetch }
      : communityData.presence.isError
        ? { label: 'Could not refresh member presence.', error: communityData.presence.error, retry: communityData.presence.refetch }
        : callOccupancy.isError
          ? { label: 'Could not refresh call occupancy.', error: callOccupancy.error, retry: callOccupancy.refetch }
      : null

  return (
    <div className="app-shell">
      <header className="app-titlebar">
        <div className="wordmark"><span className="wordmark-mark"><i /><i /></span><strong>{config.name}</strong></div>
        <GlobalSearch onOpenMember={(person) => setModal({ kind: 'member', user: person })} />
        <Inbox currentUser={currentUser} />
      </header>

      <div className={`app-grid ${showMembers && community ? '' : 'members-hidden'} ${mobileSidebarOpen ? 'mobile-sidebar-open' : ''}`}>
        <CommunityRail
          communities={communities}
          activeId={communityId}
          directActive={route.kind === 'conversations'}
          onOpenDirect={() => { navigate(appRoutes.conversations()); setMobileSidebarOpen(true) }}
          onSelect={(next) => { selectCommunity(next); setMobileSidebarOpen(true) }}
          onAdd={() => setModal({ kind: 'community' })}
        />
        {community ? (
          <ChannelSidebar
            community={community}
            channels={channels}
            activeChannelId={activeChannel?.id ?? ''}
            currentUser={currentUser}
            currentStatus={resolvedPresence(currentUser.id, visiblePresence)}
            onSelect={callNavigation.selectChannel}
            onCreate={(parent) => setModal({ kind: 'channel', parent })}
            onCategorySettings={(category) => setModal({ kind: 'channelSettings', channel: category })}
            onSettings={() => setModal({ kind: 'settings' })}
            onProfile={() => setModal({ kind: 'profile' })}
            onOpenVoice={callNavigation.openCallTarget}
            unreadChannelIds={unreadChannelIds}
            permissions={communityPermissions}
            voiceOccupancy={callOccupancy.data ?? []}
            hasMore={Boolean(communityData.channels.hasNextPage)}
            loadingMore={communityData.channels.isFetchingNextPage}
            onLoadMore={() => void communityData.channels.fetchNextPage()}
          />
        ) : (
          <DirectSidebar
            conversations={conversations}
            members={conversationMembers}
            unreadConversationIds={conversationsData.unreadConversationIds}
            activeId={activeConversation?.id ?? ''}
            currentUser={currentUser}
            currentStatus={presence.status}
            onSelect={(conversation) => { navigate(appRoutes.conversations(conversation.id)); setMobileSidebarOpen(false) }}
            onCreate={() => setModal({ kind: 'direct' })}
            onProfile={() => setModal({ kind: 'profile' })}
            onOpenVoice={callNavigation.openCallTarget}
            callOccupancy={callOccupancy.data ?? []}
            hasMore={Boolean(conversationsData.conversations.hasNextPage)}
            loadingMore={conversationsData.conversations.isFetchingNextPage}
            onLoadMore={() => void conversationsData.conversations.fetchNextPage()}
          />
        )}

        <main className="content-panel">
          {community && activeChannel ? (
            <>
              <header className="channel-toolbar">
                <button className="mobile-nav-button" type="button" aria-label="Open community navigation" onClick={() => setMobileSidebarOpen((value) => !value)}><Menu size={18} /></button>
                <div className="channel-toolbar-title"><ChannelIcon kind={activeChannel.kind} /><strong>{activeChannel.name}</strong>{activeChannel.topic ? <><span /><p>{activeChannel.topic}</p></> : null}</div>
                <div className="channel-toolbar-actions">
                  <button type="button" title={channelMute.muted ? 'Unmute channel notifications' : 'Mute channel notifications'} onClick={() => void channelMute.toggle()}>{channelMute.muted ? <BellOff size={18} /> : <Bell size={18} />}</button>
                  {(channelPermissions.has('manage_channels') || channelPermissions.has('manage_roles')) ? <button type="button" title="Channel settings" onClick={() => setModal({ kind: 'channelSettings', channel: activeChannel })}><Settings size={18} /></button> : null}
                  <button className={showMembers ? 'active' : ''} type="button" title="Member list" onClick={() => setShowMembers((value) => !value)}><Users size={19} /></button>
                </div>
              </header>
              {activeChannel.nsfw && !acknowledgedNsfw.has(activeChannel.id) ? (
                <section className="nsfw-gate"><strong>Age-restricted channel</strong><p>This channel may contain content intended for adults.</p><button className="primary-action" type="button" onClick={() => {
                  const next = new Set(acknowledgedNsfw)
                  next.add(activeChannel.id)
                  sessionStorage.setItem('thiscord_nsfw_ack', JSON.stringify([...next]))
                  setAcknowledgedNsfw(next)
                }}>Continue</button></section>
              ) : activeChannel.kind === 'voice'
                ? <VoiceChannelSurface channel={activeChannel} occupancy={callOccupancy.data ?? []} />
                : <ChannelMessageView channel={activeChannel} currentUser={currentUser} permissions={channelPermissions} />}
            </>
          ) : community ? (
            communityData.channels.isError
              ? <DataFailure error={communityData.channels.error} onRetry={() => void communityData.channels.refetch()} label="Could not load channels." />
              : <div className="loading-state">{communityData.channels.isLoading ? 'Loading channels…' : 'Select a channel.'}</div>
          ) : (
            conversationsData.conversations.isError || conversationsData.members.isError
              ? <DataFailure
                  error={conversationsData.conversations.error ?? conversationsData.members.error}
                  onRetry={() => { void conversationsData.conversations.refetch(); void conversationsData.members.refetch() }}
                  label="Could not load direct messages."
                />
               : <ConversationView
                    key={activeConversation?.id ?? 'direct-home'}
                    conversation={activeConversation}
                    members={conversationMembers}
                    currentUser={currentUser}
                    callTarget={activeConversationCallTarget}
                    callOccupancy={callOccupancy.data ?? []}
                    callActive={Boolean(
                      activeConversationCallTarget
                      && call.session
                      && sameCallTarget(call.session.target.target, activeConversationCallTarget.target)
                    )}
                    muted={conversationMute.muted}
                    onStartCall={(target) => void call.join(target)}
                    onToggleMute={() => void conversationMute.toggle()}
                    onOpenNavigation={() => setMobileSidebarOpen((value) => !value)}
                  />
          )}
        </main>
        {mobileSidebarOpen ? <button className="mobile-sidebar-scrim" type="button" aria-label="Close navigation" onClick={() => setMobileSidebarOpen(false)} /> : null}
        {community && showMembers ? (
          communityData.members.isError
            ? <aside className="members-panel"><DataFailure error={communityData.members.error} onRetry={() => void communityData.members.refetch()} label="Could not load members." /></aside>
            : <MembersPanel
                memberships={communityData.members.data ?? []}
                presence={visiblePresence}
                roles={communityData.roles.data ?? []}
                memberRoles={communityData.memberRoles.data ?? []}
                hasMore={Boolean(communityData.members.hasNextPage)}
                loadingMore={communityData.members.isFetchingNextPage}
                onLoadMore={() => void communityData.members.fetchNextPage()}
                onOpenMember={(person) => {
                  if (person.id === currentUser.id) setModal({ kind: 'profile' })
                  else void directConversation.open(person.id)
                }}
              />
        ) : null}
      </div>

      {modal?.kind === 'community' ? (
        <CommunityDialog
          onClose={() => setModal(null)}
          onCreated={async (created) => {
            await queryClient.invalidateQueries({ queryKey: communityKeys.memberships })
            setModal(null)
            navigate(appRoutes.channel(created.id))
          }}
        />
      ) : null}
      {modal?.kind === 'channel' && community ? (
        <ChannelDialog
          community={community}
          parent={modal.parent}
          onClose={() => setModal(null)}
          onCreated={async (created) => {
            await queryClient.invalidateQueries({ queryKey: channelKeys.list(community.id) })
            setModal(null)
            navigate(appRoutes.channel(community.id, created.id))
          }}
        />
      ) : null}
      {modal?.kind === 'channelSettings' && community ? (
        <ChannelSettingsDialog
          community={community}
          channel={modal.channel}
          categories={channels.filter((item) => item.kind === 'category')}
          roles={communityData.roles.data ?? []}
          canReorder={communityPermissions.has('manage_channels')}
          permissions={modal.channel.kind === 'category' ? communityPermissions : channelPermissions}
          onClose={() => setModal(null)}
          onUpdated={async () => {
            await queryClient.invalidateQueries({ queryKey: channelKeys.list(community.id) })
            setModal(null)
          }}
          onDeleted={async () => {
            await queryClient.invalidateQueries({ queryKey: channelKeys.list(community.id) })
            setModal(null)
            navigate(appRoutes.channel(community.id), { replace: true })
          }}
        />
      ) : null}
      {modal?.kind === 'settings' && community ? (
        <CommunitySettingsDialog
          community={community}
          roles={communityData.roles.data ?? []}
          memberships={communityData.members.data ?? []}
          memberRoles={communityData.memberRoles.data ?? []}
          hasMoreMembers={Boolean(communityData.members.hasNextPage)}
          loadingMoreMembers={communityData.members.isFetchingNextPage}
          onLoadMoreMembers={() => void communityData.members.fetchNextPage()}
          currentUser={currentUser}
          permissions={communityPermissions}
          highestRolePosition={communityPermissionQuery.data?.highestRolePosition ?? 0}
          owner={communityPermissionQuery.data?.owner ?? false}
          onClose={() => setModal(null)}
          onChanged={() => Promise.all([
            queryClient.invalidateQueries({ queryKey: communityKeys.memberships }),
            queryClient.invalidateQueries({ queryKey: roleKeys.list(community.id) }),
            queryClient.invalidateQueries({ queryKey: memberKeys.directory(community.id) }),
            queryClient.invalidateQueries({ queryKey: channelKeys.effectivePermissions(community.id) }),
          ]).then(() => undefined)}
          onDeleted={() => {
            setModal(null)
            void queryClient.invalidateQueries({ queryKey: communityKeys.memberships })
            navigate(appRoutes.conversations(), { replace: true })
          }}
        />
      ) : null}
      {modal?.kind === 'profile' ? (
        <ProfileDialog
          user={currentUser}
          onClose={() => setModal(null)}
          onLogout={() => void signOut()}
        />
      ) : null}
      {modal?.kind === 'member' ? (
        <MemberProfileDialog
          user={modal.user}
          onClose={() => setModal(null)}
          onMessage={modal.user.id === currentUser.id ? undefined : () => {
            const person = modal.user
            setModal(null)
            void directConversation.open(person.id)
          }}
        />
      ) : null}
      {modal?.kind === 'direct' ? (
        <DirectDialog onClose={() => setModal(null)} onCreated={async (created) => {
          await queryClient.invalidateQueries({ queryKey: conversationKeys.all })
          await queryClient.invalidateQueries({ queryKey: conversationKeys.members })
          setModal(null)
          navigate(appRoutes.conversations(created.id))
        }} />
      ) : null}
      {actionError ? <div className="toast-error" role="alert">{actionError}<button type="button" onClick={clearActionError}><X size={14} /></button></div> : null}
      {backgroundFailure ? <div className="toast-error" role="alert"><span><strong>{backgroundFailure.label}</strong> {errorMessage(backgroundFailure.error)}</span><button type="button" onClick={() => void backgroundFailure.retry()}>Retry</button></div> : null}
      {!backgroundFailure && (presence.error || realtimeStatus === 'degraded') ? <div className="toast-error connection-warning" role="status"><span>{presence.error || 'Live updates are reconnecting…'}</span></div> : null}
    </div>
  )
}
