import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import {
  callOccupancyQueryMatches,
  callTargetForRealtimeEvent,
  queryKeysForRealtimeEvent,
  realtimeCollections,
  type RealtimeCollection,
} from '../features/realtime/invalidation'
import { usePocketBase } from '../lib/contexts'
import type PocketBase from 'pocketbase'

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
  'presence',
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
    case 'presence':
      return scope.communityId
        ? client.filter('user.memberships_via_user.community ?= {:community}', { community: scope.communityId })
        : client.filter('user = {:user}', { user: scope.userId })
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

function realtimeExpandFor(collection: RealtimeCollection) {
  if (collection === 'call_sessions') return 'room'
  if (collection === 'call_participants') return 'call.room'
  return ''
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
            const callTarget = callTargetForRealtimeEvent(collection, event.record)
            if (callTarget) {
              void queryClient.invalidateQueries({
                predicate: (query) => callOccupancyQueryMatches(query.queryKey, callTarget),
              })
              return
            }
            for (const queryKey of queryKeysForRealtimeEvent(collection, event.record)) {
              void queryClient.invalidateQueries({ queryKey })
            }
          }, filter || expand ? { filter, expand } : undefined)
          return unsubscribe
        }), () => cancelled)
        unsubscribers.push(...connected)
        if (!cancelled) setStatus('connected')
      } catch {
        if (!cancelled) {
          for (const unsubscribe of unsubscribers.splice(0)) void unsubscribe()
          setStatus('degraded')
          retryTimer = window.setTimeout(() => void connect(), 5_000)
        }
      }
    }
    void connect()

    return () => {
      cancelled = true
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
