import { useQueryClient } from '@tanstack/react-query'
import type {
  CallParticipantRecord,
  DirectMessage,
  Message,
} from '@thiscord/shared'
import type { InfiniteData, QueryKey } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import {
  callOccupancyQueryMatches,
  callTargetForRealtimeEvent,
  queryKeysForRealtimeEvent,
  realtimeCollections,
  updateCallOccupancyCache,
  updateMessageHistoryCache,
  updatePresenceDirectoryCache,
  type RealtimeCollection,
} from '../features/realtime/invalidation'
import { usePocketBase } from '../lib/contexts'
import type PocketBase from 'pocketbase'
import type {
  CommunityMemberPage,
  PresenceRecord,
} from '../features/members/api'
import { memberKeys } from '../features/members/queryKeys'
import { callKeys } from '../features/calls/queryKeys'
import { messageKeys } from '../features/messaging/queryKeys'
import { conversationKeys } from '../features/conversations/queryKeys'
import type { MessageCursor } from '../features/messaging/api'
import type { DirectMessageCursor } from '../features/conversations/api'

export interface RealtimeScope {
  readonly enabled: boolean
  readonly userId: string
  readonly communityId: string
}

const communityScopedCollections = new Set<RealtimeCollection>([
  'roles',
  'member_roles',
  'channels',
  'channel_permissions',
  'messages',
  'reactions',
  'read_states',
  'typing',
  'community_presence',
])

export function realtimeFilterFor(
  client: Pick<PocketBase, 'filter'>,
  scope: RealtimeScope,
  collection: RealtimeCollection,
) {
  const communityFilter = scope.communityId
    ? client.filter('community = {:community}', { community: scope.communityId })
    : ''
  switch (collection) {
    case 'communities':
      return client.filter(
        'memberships_via_community.user ?= {:user} && memberships_via_community.state ?= "active"',
        { user: scope.userId },
      )
    case 'memberships':
      return scope.communityId
        ? client.filter('(community = {:community} || user = {:user})', {
            community: scope.communityId,
            user: scope.userId,
          })
        : client.filter('user = {:user}', { user: scope.userId })
    case 'roles':
    case 'channels':
      return communityFilter
    case 'member_roles':
      return scope.communityId
        ? client.filter('membership.community = {:community}', { community: scope.communityId })
        : ''
    case 'channel_permissions':
      return scope.communityId
        ? client.filter('channel.community = {:community}', { community: scope.communityId })
        : ''
    case 'messages':
    case 'reactions':
    case 'read_states':
    case 'typing':
      return scope.communityId
        ? client.filter(`${collection === 'messages' ? 'channel' : collection === 'reactions' ? 'message.channel' : 'channel'}.community = {:community}`, {
            community: scope.communityId,
          })
        : ''
    case 'community_presence':
      return communityFilter
    case 'notifications':
      return client.filter('user = {:user}', { user: scope.userId })
    case 'conversations':
      return client.filter(
        'conversation_members_via_conversation.user ?= {:user}',
        { user: scope.userId },
      )
    case 'conversation_members':
      return client.filter(
        '(user = {:user} || conversation.conversation_members_via_conversation.user ?= {:user})',
        { user: scope.userId },
      )
    case 'direct_messages':
    case 'direct_typing':
      return client.filter(
        'conversation.conversation_members_via_conversation.user ?= {:user}',
        { user: scope.userId },
      )
    case 'direct_reactions':
      return client.filter(
        'message.conversation.conversation_members_via_conversation.user ?= {:user}',
        { user: scope.userId },
      )
    case 'call_rooms':
      return scope.communityId
        ? client.filter(
            '(channel.community = {:community} || conversation.conversation_members_via_conversation.user ?= {:user})',
            { community: scope.communityId, user: scope.userId },
          )
        : client.filter(
            'conversation.conversation_members_via_conversation.user ?= {:user}',
            { user: scope.userId },
          )
    case 'call_sessions':
      return scope.communityId
        ? client.filter(
            '(room.channel.community = {:community} || room.conversation.conversation_members_via_conversation.user ?= {:user})',
            { community: scope.communityId, user: scope.userId },
          )
        : client.filter(
            'room.conversation.conversation_members_via_conversation.user ?= {:user}',
            { user: scope.userId },
          )
    case 'call_participants':
      return scope.communityId
        ? client.filter(
            '(call.room.channel.community = {:community} || call.room.conversation.conversation_members_via_conversation.user ?= {:user})',
            { community: scope.communityId, user: scope.userId },
          )
        : client.filter(
            'call.room.conversation.conversation_members_via_conversation.user ?= {:user}',
            { user: scope.userId },
          )
    default:
      return ''
  }
}

export function realtimeExpandFor(collection: RealtimeCollection) {
  if (collection === 'messages' || collection === 'direct_messages') {
    return 'author,replyTo,replyTo.author'
  }
  if (collection === 'call_sessions') return 'room'
  if (collection === 'call_participants') return 'call.room'
  return ''
}

interface MessagePage<TMessage, TCursor> {
  readonly perPage: number
  readonly hasMore: boolean
  readonly nextCursor: TCursor | null
  readonly items: readonly TMessage[]
}

function queryKeysEqual(left: QueryKey, right: QueryKey) {
  return left.length === right.length
    && left.every((value, index) => value === right[index])
}

export async function settleRealtimeSubscriptions(
  subscriptions: readonly Promise<() => void>[],
  isCancelled: () => boolean,
) {
  const unsubscribers: Array<() => void> = []
  let failed = false
  try {
    await Promise.all(subscriptions.map(async (subscription) => {
      const unsubscribe = await subscription
      if (failed || isCancelled()) {
        void unsubscribe()
      } else {
        unsubscribers.push(unsubscribe)
      }
    }))
  } catch (error) {
    failed = true
    for (const unsubscribe of unsubscribers.splice(0)) void unsubscribe()
    throw error
  }
  if (!isCancelled()) return unsubscribers
  for (const unsubscribe of unsubscribers) void unsubscribe()
  return []
}

export function useRealtimeInvalidation(scope: RealtimeScope) {
  const client = usePocketBase()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<'connecting' | 'connected' | 'degraded'>('connecting')

  useEffect(() => {
    if (!scope.enabled) return
    const unsubscribers: Array<() => void> = []
    let cancelled = false
    let retryTimer: number | undefined
    let realtimeConnected = false

    const closeSubscriptionRace = () => {
      if (scope.communityId) {
        void queryClient.invalidateQueries({
          queryKey: memberKeys.directory(scope.communityId),
        })
      }
      void queryClient.invalidateQueries({ queryKey: callKeys.all })
    }

    const connect = async () => {
      try {
        const collections = scope.communityId
          ? realtimeCollections
          : realtimeCollections.filter((collection) => !communityScopedCollections.has(collection))
        const connected = await settleRealtimeSubscriptions(collections.map(async (collection) => {
          const filter = realtimeFilterFor(client, {
            enabled: scope.enabled,
            userId: scope.userId,
            communityId: scope.communityId,
          }, collection)
          const expand = realtimeExpandFor(collection)
          const unsubscribe = await client.collection(collection).subscribe('*', (event) => {
            if (!['create', 'update', 'delete'].includes(event.action)) return
            const action = event.action as 'create' | 'update' | 'delete'
            if (collection === 'community_presence') {
              queryClient.setQueriesData<InfiniteData<CommunityMemberPage>>(
                {
                  queryKey: event.record.community
                    ? memberKeys.directory(event.record.community)
                    : memberKeys.directories,
                },
                (current) => updatePresenceDirectoryCache(
                  current,
                  action,
                  event.record as unknown as PresenceRecord,
                ),
              )
              return
            }
            let patchedMessageKey: QueryKey | undefined
            if (collection === 'messages' && event.record.channel) {
              patchedMessageKey = messageKeys.channel(event.record.channel)
              queryClient.setQueryData<InfiniteData<MessagePage<Message, MessageCursor>>>(
                patchedMessageKey,
                (current) => updateMessageHistoryCache(
                  current,
                  action,
                  event.record as unknown as Message,
                ),
              )
            } else if (collection === 'direct_messages' && event.record.conversation) {
              patchedMessageKey = conversationKeys.messages(event.record.conversation)
              queryClient.setQueryData<InfiniteData<MessagePage<DirectMessage, DirectMessageCursor>>>(
                patchedMessageKey,
                (current) => updateMessageHistoryCache(
                  current,
                  action,
                  event.record as unknown as DirectMessage,
                ),
              )
            }
            const callTarget = callTargetForRealtimeEvent(collection, event.record)
            if (collection === 'call_participants' && callTarget) {
              queryClient.setQueriesData<readonly CallParticipantRecord[]>(
                {
                  predicate: (query) => callOccupancyQueryMatches(
                    query.queryKey,
                    callTarget,
                  ),
                },
                (current) => updateCallOccupancyCache(
                  current,
                  action,
                  event.record as unknown as CallParticipantRecord,
                ),
              )
              return
            }
            if (callTarget) {
              void queryClient.invalidateQueries({
                predicate: (query) => callOccupancyQueryMatches(query.queryKey, callTarget),
              })
              return
            }
            for (const queryKey of queryKeysForRealtimeEvent(collection, event.record)) {
              if (patchedMessageKey && queryKeysEqual(queryKey, patchedMessageKey)) continue
              void queryClient.invalidateQueries({ queryKey })
            }
          }, filter || expand ? { filter, expand } : undefined)
          return unsubscribe
        }), () => cancelled)
        unsubscribers.push(...connected)
        if (!cancelled) {
          realtimeConnected = true
          setStatus('connected')
          closeSubscriptionRace()
        }
      } catch {
        if (!cancelled) {
          for (const unsubscribe of unsubscribers.splice(0)) void unsubscribe()
          setStatus('degraded')
          retryTimer = window.setTimeout(() => void connect(), 5_000)
        }
      }
    }
    void connect()
    const connectionCheck = window.setInterval(() => {
      if (cancelled) return
      const connected = client.realtime.isConnected
      if (connected && !realtimeConnected) closeSubscriptionRace()
      realtimeConnected = connected
      setStatus(connected ? 'connected' : 'degraded')
    }, 2_000)

    return () => {
      cancelled = true
      window.clearInterval(connectionCheck)
      if (retryTimer) window.clearTimeout(retryTimer)
      for (const unsubscribe of unsubscribers) void unsubscribe()
    }
  }, [
    client,
    queryClient,
    scope.communityId,
    scope.enabled,
    scope.userId,
  ])

  return scope.enabled ? status : 'connecting'
}
