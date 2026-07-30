import { t } from '../lib/i18n'
import type {
  Channel,
  Community,
  Membership,
  User,
} from '@thiscord/shared'
import { useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../auth/AuthProvider'
import { useDialogAccessibility } from '../hooks/useDialogAccessibility'
import { useRealtimeInvalidation } from '../hooks/useRealtimeInvalidation'
import { usePocketBase, useRuntimeConfig } from '../lib/contexts'
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
import { ChannelSidebar } from '../features/channels/ChannelSidebar'
import {
  useChannelTarget,
  useCommunityChannels,
  useEffectivePermissions,
} from '../features/channels/queries'
import { channelKeys } from '../features/channels/queryKeys'
import { useChannelMute } from '../features/channels/useChannelMute'
import { CommunityRail } from '../features/communities/CommunityRail'
import { communityKeys } from '../features/communities/queryKeys'
import { useMemberships } from '../features/communities/queries'
import { DirectSidebar } from '../features/conversations/DirectSidebar'
import { conversationKeys } from '../features/conversations/queryKeys'
import {
  useConversations,
  useConversationTarget,
} from '../features/conversations/queries'
import { ConversationView } from '../features/conversations/ConversationView'
import { useConversationMute } from '../features/conversations/useConversationMute'
import { useOpenDirectConversation } from '../features/conversations/useOpenDirectConversation'
import { ChannelMessageView } from '../features/messaging/ChannelMessageView'
import { MembersPanel } from '../features/members/MembersPanel'
import type { ModerationAction } from '../features/members/MemberAdministration'
import { useCommunityMembers } from '../features/members/queries'
import { memberApi } from '../features/members/api'
import type { MemberInteractions } from '../features/members/memberInteractions'
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
import { DataFailure, LoadingState } from './WorkspacePrimitives'
import {
  ChannelToolbar,
  WorkspaceHelp,
  WorkspaceTitlebar,
} from './WorkspaceChrome'
import { resolvedPresence } from './workspaceUtils'

const loadChannelDialogs = () => import('../features/channels/ChannelDialogs')
const loadCommunityDialog = () => import('../features/communities/CommunityDialog')
const loadCommunitySettingsDialog = () => import('../features/communities/CommunitySettingsDialog')
const loadConversationDialogs = () => import('../features/conversations/ConversationDialogs')
const loadMemberAdministration = () => import('../features/members/MemberAdministration')
const loadProfileDialogs = () => import('../features/members/ProfileDialogs')

const ChannelDialog = lazy(() => loadChannelDialogs().then((module) => ({
  default: module.ChannelDialog,
})))
const ChannelSettingsDialog = lazy(() => loadChannelDialogs().then((module) => ({
  default: module.ChannelSettingsDialog,
})))
const CommunityDialog = lazy(() => loadCommunityDialog().then((module) => ({
  default: module.CommunityDialog,
})))
const CommunitySettingsDialog = lazy(() => loadCommunitySettingsDialog().then((module) => ({
  default: module.CommunitySettingsDialog,
})))
const DirectDialog = lazy(() => loadConversationDialogs().then((module) => ({
  default: module.DirectDialog,
})))
const ModerationDialog = lazy(() => loadMemberAdministration().then((module) => ({
  default: module.ModerationDialog,
})))
const MemberProfileDialog = lazy(() => loadProfileDialogs().then((module) => ({
  default: module.MemberProfileDialog,
})))
const ProfileDialog = lazy(() => loadProfileDialogs().then((module) => ({
  default: module.ProfileDialog,
})))

type Modal =
  | { readonly kind: 'community' }
  | { readonly kind: 'channel'; readonly parent: string }
  | { readonly kind: 'channelSettings'; readonly channel: Channel }
  | { readonly kind: 'settings' }
  | { readonly kind: 'profile' }
  | { readonly kind: 'member'; readonly user: User }
  | {
      readonly kind: 'moderation'
      readonly community: Community
      readonly membership: Membership
      readonly action: ModerationAction
    }
  | { readonly kind: 'direct' }
  | null

function CompactMembersDialog({
  onClose,
  children,
}: {
  readonly onClose: () => void
  readonly children: ReactNode
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  useDialogAccessibility(dialogRef, onClose)
  return createPortal(
    <dialog ref={dialogRef} className="members-panel-dialog" aria-label={t("workspace.app.memberList")}>
      {children}
    </dialog>,
    document.body,
  )
}

function useWorkspaceApp() {
  const { pathname, navigate } = useAppRouter()
  const route = parseAppRoute(pathname)
  const communityId = route.kind === 'channel' ? route.communityId : ''
  const channelId = route.kind === 'channel'
    ? route.channelId
    : route.kind === 'conversations'
      ? route.conversationId
      : ''
  const config = useRuntimeConfig()
  const client = usePocketBase()
  const queryClient = useQueryClient()
  const { user, logout } = useAuth()
  const call = useCall()
  const currentUser = user!
  useUserAppearance(currentUser.preferences)
  const memberships = useMemberships(currentUser.id)
  const communities = (memberships.data ?? []).flatMap((membership) => (
    membership.expand?.community ? [membership.expand.community] : []
  ))
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
    () => channels.flatMap((channel) => (
      channel.kind === 'voice' ? [channelCallTarget(channel)] : []
    )),
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
  const [compactMembersViewport, setCompactMembersViewport] = useState(
    () => window.matchMedia('(max-width: 1120px)').matches,
  )
  const [showMembers, setShowMembers] = useState(
    () => !window.matchMedia('(max-width: 1120px)').matches,
  )
  const [modal, setModal] = useState<Modal>(null)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [mobileViewport, setMobileViewport] = useState(
    () => window.matchMedia('(max-width: 640px)').matches,
  )
  const mobileNavigationModal = mobileSidebarOpen && mobileViewport
  const mobileNavigationTriggerRef = useRef<HTMLButtonElement>(null)
  const [memberActionBusy, setMemberActionBusy] = useState(false)
  const [memberActionError, setMemberActionError] = useState('')
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

  useEffect(() => {
    const media = window.matchMedia('(max-width: 640px)')
    const update = () => setMobileViewport(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1120px)')
    const update = () => {
      setCompactMembersViewport(media.matches)
      if (media.matches) setShowMembers(false)
    }
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!mobileNavigationModal) return
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : mobileNavigationTriggerRef.current
    const focusNavigation = window.requestAnimationFrame(() => {
      const activeDestination = document.querySelector<HTMLElement>(
        '#community-navigation [aria-current="page"]',
      )
      const firstNavigationControl = document.querySelector<HTMLElement>(
        '#community-navigation button:not([disabled])',
      )
      ;(activeDestination ?? firstNavigationControl)?.focus()
    })
    const navigationControls = () => [
      ...document.querySelectorAll<HTMLElement>(
        '.server-rail button:not([disabled]), '
        + '#community-navigation button:not([disabled]), '
        + '.mobile-sidebar-scrim',
      ),
    ].filter((element) => element.getClientRects().length > 0)
    const handleNavigationKeys = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setMobileSidebarOpen(false)
        return
      }
      if (event.key !== 'Tab') return
      const controls = navigationControls()
      if (!controls.length) return
      const first = controls[0]
      const last = controls.at(-1)!
      const active = document.activeElement
      if (event.shiftKey && (active === first || !controls.includes(active as HTMLElement))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (active === last || !controls.includes(active as HTMLElement))) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handleNavigationKeys)
    return () => {
      window.cancelAnimationFrame(focusNavigation)
      window.removeEventListener('keydown', handleNavigationKeys)
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [mobileNavigationModal])
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
  const memberRolePositions = useMemo(() => {
    const rolePositionById = new Map(
      (communityData.roles.data ?? []).map((role) => [role.id, role.position]),
    )
    const positions = new Map<string, number>()
    for (const assignment of communityData.memberRoles.data ?? []) {
      positions.set(
        assignment.membership,
        Math.max(
          positions.get(assignment.membership) ?? 0,
          rolePositionById.get(assignment.role) ?? 0,
        ),
      )
    }
    return positions
  }, [communityData.memberRoles.data, communityData.roles.data])
  const canModerateUser = useCallback((userId: string) => {
    if (!community || userId === currentUser.id || userId === community.owner) return false
    if (communityPermissionQuery.data?.owner) return true
    const targetMembership = (communityData.members.data ?? []).find(
      (membership) => membership.user === userId,
    )
    if (!targetMembership) return false
    return (memberRolePositions.get(targetMembership.id) ?? 0)
      < (communityPermissionQuery.data?.highestRolePosition ?? 0)
  }, [
    community,
    communityData.members.data,
    communityPermissionQuery.data?.highestRolePosition,
    communityPermissionQuery.data?.owner,
    currentUser.id,
    memberRolePositions,
  ])
  const openMemberProfile = useCallback((person: User) => {
    setModal(person.id === currentUser.id
      ? { kind: 'profile' }
      : { kind: 'member', user: person })
  }, [currentUser.id])
  const messageMember = useCallback((person: User) => {
    if (person.id !== currentUser.id) void directConversation.open(person.id)
  }, [currentUser.id, directConversation])
  const communityMemberInteractions = useMemo<MemberInteractions>(() => ({
    currentUserId: currentUser.id,
    memberships: communityData.members.data ?? [],
    canManageMembers: communityPermissions.has('manage_members'),
    canModerateUser,
    onOpenProfile: openMemberProfile,
    onMessage: messageMember,
    onModerate: community
      ? (membership, action) => {
          setMemberActionError('')
          setModal({ kind: 'moderation', community, membership, action })
        }
      : undefined,
  }), [
    canModerateUser,
    community,
    communityData.members.data,
    communityPermissions,
    currentUser.id,
    messageMember,
    openMemberProfile,
  ])
  const directMemberInteractions = useMemo<MemberInteractions>(() => ({
    currentUserId: currentUser.id,
    onOpenProfile: openMemberProfile,
    onMessage: messageMember,
  }), [currentUser.id, messageMember, openMemberProfile])
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
      .flatMap((item) => (
        item.author === currentUser.id || item.channel === activeChannel?.id
          ? []
          : [item.channel]
      )),
  )
  const actionError = channelMute.error || conversationMute.error || directConversation.error
  const clearActionError = () => {
    channelMute.clearError()
    conversationMute.clearError()
    directConversation.clearError()
  }

  if (memberships.isLoading) {
    return <LoadingState fullscreen>{t("workspace.app.loadingYourCommunities")}</LoadingState>
  }
  if (memberships.isError) {
    return <main className="fatal-startup"><section><h1>{t("workspace.app.couldNotLoadYourCommunities")}</h1><p>{errorMessage(memberships.error)}</p><button className="primary-action" type="button" onClick={() => void memberships.refetch()}>{t("workspace.app.tryAgain")}</button></section></main>
  }
  const backgroundFailure = channelTarget.isError && !requestWasDeniedOrMissing(channelTarget.error)
    ? { label: t("workspace.app.couldNotLoadTheLinkedChannel"), error: channelTarget.error, retry: channelTarget.refetch }
    : conversationTarget.isError
      ? { label: t("workspace.app.couldNotLoadTheLinkedConversation"), error: conversationTarget.error, retry: conversationTarget.refetch }
      : communityPermissionQuery.isError
        ? { label: t("workspace.app.couldNotLoadYourCommunityPermissions"), error: communityPermissionQuery.error, retry: communityPermissionQuery.refetch }
        : channelPermissionQuery.isError
      ? { label: t("workspace.app.couldNotLoadThisChannelsPermissions"), error: channelPermissionQuery.error, retry: channelPermissionQuery.refetch }
      : communityData.unreadSummary.isError
        ? { label: t("workspace.app.couldNotRefreshUnreadChannels"), error: communityData.unreadSummary.error, retry: communityData.unreadSummary.refetch }
      : communityData.presence.isError
        ? { label: t("workspace.app.couldNotRefreshMemberPresence"), error: communityData.presence.error, retry: communityData.presence.refetch }
        : callOccupancy.isError
          ? { label: t("workspace.app.couldNotRefreshCallOccupancy"), error: callOccupancy.error, retry: callOccupancy.refetch }
      : null
  const membersPanel = community && showMembers ? (
    <MembersPanel
      memberships={communityData.members.data ?? []}
      presence={visiblePresence}
      roles={communityData.roles.data ?? []}
      memberRoles={communityData.memberRoles.data ?? []}
      hasMore={Boolean(communityData.members.hasNextPage)}
      loadingMore={communityData.members.isFetchingNextPage}
      onLoadMore={() => void communityData.members.fetchNextPage()}
      interactions={communityMemberInteractions}
      error={communityData.members.isError ? communityData.members.error : undefined}
      onRetry={() => void communityData.members.refetch()}
      onClose={compactMembersViewport ? () => setShowMembers(false) : undefined}
    />
  ) : null

  return (
    <div className="app-shell">
      <WorkspaceTitlebar
        name={config.name}
        search={<GlobalSearch onOpenMember={(person) => setModal({ kind: 'member', user: person })} />}
        inbox={<Inbox currentUser={currentUser} />}
        help={<WorkspaceHelp supportUrl={config.supportUrl} />}
        inert={mobileNavigationModal}
      />

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
            memberInteractions={communityMemberInteractions}
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

        <main
          className="content-panel"
          inert={mobileNavigationModal ? true : undefined}
          aria-busy={community
            ? communityData.channels.isLoading
            : conversationsData.conversations.isLoading || conversationsData.members.isLoading}
        >
          {community && activeChannel ? (
            <>
              <ChannelToolbar
                channel={activeChannel}
                navigationOpen={mobileSidebarOpen}
                navigationTriggerRef={mobileNavigationTriggerRef}
                muted={channelMute.muted}
                canManage={channelPermissions.has('manage_channels') || channelPermissions.has('manage_roles')}
                membersOpen={showMembers}
                onToggleNavigation={() => {
                  setShowMembers(false)
                  setMobileSidebarOpen((value) => !value)
                }}
                onToggleMute={() => void channelMute.toggle()}
                onOpenSettings={() => setModal({ kind: 'channelSettings', channel: activeChannel })}
                onToggleMembers={() => {
                  setMobileSidebarOpen(false)
                  setShowMembers((value) => !value)
                }}
              />
              {activeChannel.nsfw && !acknowledgedNsfw.has(activeChannel.id) ? (
                <section className="nsfw-gate"><strong>{t("workspace.app.ageRestrictedChannel")}</strong><p>{t("workspace.app.thisChannelMayContainContentIntendedForAdults")}</p><button className="primary-action" type="button" onClick={() => {
                  const next = new Set(acknowledgedNsfw)
                  next.add(activeChannel.id)
                  sessionStorage.setItem('thiscord_nsfw_ack', JSON.stringify([...next]))
                  setAcknowledgedNsfw(next)
                }}>{t("workspace.app.enterAgeRestrictedChannel")}</button></section>
              ) : activeChannel.kind === 'voice'
                ? (
                    <VoiceChannelSurface
                      channel={activeChannel}
                      occupancy={callOccupancy.data ?? []}
                      memberInteractions={communityMemberInteractions}
                    />
                  )
                : (
                    <ChannelMessageView
                      channel={activeChannel}
                      currentUser={currentUser}
                      permissions={channelPermissions}
                      onOpenProfile={openMemberProfile}
                    />
                  )}
            </>
          ) : community ? (
            communityData.channels.isError
              ? <DataFailure error={communityData.channels.error} onRetry={() => void communityData.channels.refetch()} label={t("workspace.app.couldNotLoadChannels")} />
              : <LoadingState>{communityData.channels.isLoading ? t("workspace.app.loadingChannels") : t("workspace.app.selectAChannel")}</LoadingState>
          ) : (
            conversationsData.conversations.isError || conversationsData.members.isError
              ? <DataFailure
                  error={conversationsData.conversations.error ?? conversationsData.members.error}
                  onRetry={() => { void conversationsData.conversations.refetch(); void conversationsData.members.refetch() }}
                  label={t("workspace.app.couldNotLoadDirectMessages")}
                />
               : conversationsData.conversations.isLoading || conversationsData.members.isLoading
                 ? <LoadingState>{t("workspace.app.loadingConversations")}</LoadingState>
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
                      navigationOpen={mobileSidebarOpen}
                      onStartCall={(target) => void call.join(target)}
                      onToggleMute={() => void conversationMute.toggle()}
                      onOpenNavigation={() => setMobileSidebarOpen((value) => !value)}
                      memberInteractions={directMemberInteractions}
                    />
          )}
        </main>
        {mobileSidebarOpen ? <button className="mobile-sidebar-scrim" type="button" aria-label={t("workspace.app.closeNavigation")} onClick={() => setMobileSidebarOpen(false)} /> : null}
        {!compactMembersViewport ? membersPanel : null}
      </div>
      {compactMembersViewport && membersPanel ? (
        <CompactMembersDialog onClose={() => setShowMembers(false)}>
          {membersPanel}
        </CompactMembersDialog>
      ) : null}

      <Suspense fallback={<div className="modal-loading" role="status">{t("workspace.app.openingDialog")}</div>}>
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
      {modal?.kind === 'moderation' ? (
        <ModerationDialog
          action={modal.action}
          memberName={
            modal.membership.nickname
            || modal.membership.expand?.user?.displayName
            || t("workspace.app.unknownMember")
          }
          busy={memberActionBusy}
          error={memberActionError}
          onClose={() => {
            if (!memberActionBusy) {
              setMemberActionError('')
              setModal(null)
            }
          }}
          onConfirm={async (reason, durationMinutes) => {
            if (memberActionBusy) return
            setMemberActionBusy(true)
            setMemberActionError('')
            try {
              await memberApi.moderate(client, modal.community.id, {
                action: modal.action,
                userId: modal.membership.user,
                reason,
                durationMinutes,
              })
              await Promise.all([
                queryClient.invalidateQueries({
                  queryKey: memberKeys.directory(modal.community.id),
                }),
                queryClient.invalidateQueries({
                  queryKey: communityKeys.memberships,
                }),
                queryClient.invalidateQueries({
                  queryKey: channelKeys.effectivePermissions(modal.community.id),
                }),
              ])
              setModal(null)
            } catch (caught) {
              setMemberActionError(errorMessage(caught))
            } finally {
              setMemberActionBusy(false)
            }
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
      </Suspense>
      {actionError ? <div className="toast-error" role="alert">{actionError}<button type="button" aria-label={t("workspace.app.dismissError")} onClick={clearActionError}><X size={14} /></button></div> : null}
      {backgroundFailure ? <div className="toast-error" role="alert"><span><strong>{backgroundFailure.label}</strong> {errorMessage(backgroundFailure.error)}</span><button type="button" onClick={() => void backgroundFailure.retry()}>{t("workspace.app.retry")}</button></div> : null}
      {!backgroundFailure && (presence.error || realtimeStatus === 'degraded') ? <div className="toast-error connection-warning" role="status"><span>{presence.error || t("workspace.app.liveUpdatesAreReconnecting")}</span></div> : null}
    </div>
  )
}

export function WorkspaceApp() {
  return useWorkspaceApp()
}
