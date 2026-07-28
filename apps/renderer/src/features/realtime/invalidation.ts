import type { CallParticipantRecord } from '@thiscord/shared'
import type { InfiniteData, QueryKey } from '@tanstack/react-query'
import { callKeys } from '../calls/queryKeys'
import { channelKeys } from '../channels/queryKeys'
import { communityKeys } from '../communities/queryKeys'
import { conversationKeys } from '../conversations/queryKeys'
import { memberKeys } from '../members/queryKeys'
import { messageKeys } from '../messaging/queryKeys'
import { notificationKeys } from '../notifications/queryKeys'
import { roleKeys } from '../roles/queryKeys'
import { searchKeys } from '../search/queryKeys'
import type {
  CommunityMemberPage,
  PresenceRecord,
} from '../members/api'

export const realtimeCollections = [
  'communities',
  'memberships',
  'roles',
  'member_roles',
  'channels',
  'channel_permissions',
  'messages',
  'reactions',
  'read_states',
  'community_presence',
  'conversations',
  'conversation_members',
  'direct_messages',
  'direct_reactions',
  'call_rooms',
  'call_sessions',
  'call_participants',
  'notifications',
] as const

export type RealtimeCollection = typeof realtimeCollections[number]

export interface RealtimeRecord {
  readonly id?: string
  readonly user?: string
  readonly community?: string
  readonly channel?: string
  readonly conversation?: string
  readonly membership?: string
  readonly status?: string
  readonly leftAt?: string
  readonly expand?: {
    readonly room?: RealtimeRecord
    readonly call?: RealtimeRecord
  }
}

export function updatePresenceDirectoryCache(
  current: InfiniteData<CommunityMemberPage> | undefined,
  action: 'create' | 'update' | 'delete',
  record: PresenceRecord,
) {
  if (!current) return current
  let changed = false
  const pages = current.pages.map((page) => {
    const containsUser = page.items.some((membership) => membership.user === record.user)
    const containsPresence = page.presence.some((item) => item.user === record.user)
    if (!containsUser && !containsPresence) return page
    const next = page.presence.filter((item) => item.user !== record.user)
    if (action !== 'delete') next.push(record)
    changed = true
    return { ...page, presence: next }
  })
  return changed ? { ...current, pages } : current
}

export function updateCallOccupancyCache(
  current: readonly CallParticipantRecord[] | undefined,
  action: 'create' | 'update' | 'delete',
  record: CallParticipantRecord,
) {
  if (!current) return current
  const existing = current.find((item) => item.id === record.id)
  const remaining = current.filter((item) => item.id !== record.id)
  const existingCall = existing?.expand?.call
  const incomingCall = record.expand?.call
  const mergedExpand: CallParticipantRecord['expand'] = existing?.expand || record.expand
    ? {
        user: record.expand?.user ?? existing?.expand?.user,
        call: incomingCall
          ? {
              ...incomingCall,
              expand: incomingCall.expand || existingCall?.expand
                ? {
                    ...existingCall?.expand,
                    ...incomingCall.expand,
                    room: incomingCall.expand?.room ?? existingCall?.expand?.room,
                  }
                : undefined,
            }
          : existingCall,
      }
    : undefined
  const mergedRecord: CallParticipantRecord = existing
    ? {
        ...existing,
        ...record,
        expand: mergedExpand,
      }
    : record
  return action === 'delete' || Boolean(record.leftAt)
    ? remaining
    : [...remaining, mergedRecord]
}

export function updateMessageHistoryCache<
  TMessage extends { readonly id: string },
  TPage extends { readonly items: readonly TMessage[] },
>(
  current: InfiniteData<TPage> | undefined,
  action: 'create' | 'update' | 'delete',
  record: TMessage,
) {
  if (!current) return current
  let found = false
  let keptReplacement = false
  let changed = false
  const pages = current.pages.map((page) => {
    const items: TMessage[] = []
    for (const item of page.items) {
      if (item.id !== record.id) {
        items.push(item)
        continue
      }
      found = true
      changed = true
      if (action !== 'delete' && !keptReplacement) {
        items.push(record)
        keptReplacement = true
      }
    }
    return items.length === page.items.length && !page.items.some((item) => item.id === record.id)
      ? page
      : { ...page, items }
  })
  if (action === 'create' && !found && pages[0]) {
    pages[0] = { ...pages[0], items: [record, ...pages[0].items] }
    changed = true
  }
  return changed ? { ...current, pages } : current
}

function present(...keys: Array<QueryKey | undefined>) {
  return keys.filter((key): key is QueryKey => Boolean(key))
}

export function queryKeysForRealtimeEvent(
  collection: RealtimeCollection,
  record: RealtimeRecord = {},
): readonly QueryKey[] {
  switch (collection) {
    case 'communities':
      return present(
        communityKeys.memberships,
        record.id ? channelKeys.list(record.id) : channelKeys.all,
        record.id ? messageKeys.unreadSummary(record.id) : messageKeys.unreadSummaries,
        record.id ? channelKeys.effectivePermissions(record.id) : channelKeys.effectivePermissionsAll,
        searchKeys.all,
      )
    case 'memberships':
      return present(
        record.user ? communityKeys.membershipsForUser(record.user) : communityKeys.memberships,
        record.community ? memberKeys.directory(record.community) : memberKeys.directories,
        record.community ? channelKeys.effectivePermissions(record.community) : channelKeys.effectivePermissionsAll,
        searchKeys.all,
      )
    case 'roles':
      return present(
        record.community ? roleKeys.list(record.community) : roleKeys.all,
        record.community ? memberKeys.directory(record.community) : memberKeys.directories,
        record.community ? channelKeys.effectivePermissions(record.community) : channelKeys.effectivePermissionsAll,
        record.community ? channelKeys.list(record.community) : channelKeys.all,
        record.community ? messageKeys.unreadSummary(record.community) : messageKeys.unreadSummaries,
        searchKeys.all,
      )
    case 'member_roles':
      return present(
        record.membership ? roleKeys.assignmentsForMember(record.membership) : roleKeys.assignments,
        memberKeys.directories,
        channelKeys.effectivePermissionsAll,
        channelKeys.all,
        messageKeys.unreadSummaries,
        searchKeys.all,
      )
    case 'channels':
      return present(
        record.community ? channelKeys.list(record.community) : channelKeys.all,
        record.community ? messageKeys.unreadSummary(record.community) : messageKeys.unreadSummaries,
        searchKeys.all,
      )
    case 'channel_permissions':
      return present(
        record.channel ? channelKeys.permissions(record.channel) : channelKeys.permissionsAll,
        channelKeys.effectivePermissionsAll,
        channelKeys.all,
        messageKeys.unreadSummaries,
        searchKeys.all,
      )
    case 'messages':
      return present(
        record.channel ? messageKeys.channel(record.channel) : messageKeys.all,
        messageKeys.searchAll,
        messageKeys.unreadSummaries,
        searchKeys.all,
      )
    case 'reactions':
      return [messageKeys.reactionsAll]
    case 'read_states':
      return [messageKeys.unreadSummaries]
    case 'community_presence':
      return [memberKeys.directories]
    case 'conversations':
      return [conversationKeys.all, searchKeys.all]
    case 'conversation_members':
      return present(
        record.user ? conversationKeys.memberships(record.user) : conversationKeys.members,
        conversationKeys.all,
        searchKeys.all,
      )
    case 'direct_messages':
      return present(
        record.conversation ? conversationKeys.messages(record.conversation) : conversationKeys.messagesAll,
        conversationKeys.searchAll,
        conversationKeys.all,
        searchKeys.all,
      )
    case 'direct_reactions':
      return [conversationKeys.reactionsAll]
    case 'call_rooms':
    case 'call_sessions':
    case 'call_participants':
      return [callKeys.all]
    case 'notifications':
      return [record.user ? notificationKeys.list(record.user) : notificationKeys.all]
  }
}

export function callTargetForRealtimeEvent(
  collection: RealtimeCollection,
  record: RealtimeRecord,
) {
  const room = collection === 'call_rooms'
    ? record
    : collection === 'call_sessions'
      ? record.expand?.room
      : collection === 'call_participants'
        ? record.expand?.call?.expand?.room
        : undefined
  if (room?.channel) return `channel:${room.channel}`
  if (room?.conversation) return `conversation:${room.conversation}`
  return ''
}

export function callOccupancyQueryMatches(queryKey: QueryKey, target: string) {
  return queryKey[0] === callKeys.all[0]
    && typeof queryKey[1] === 'string'
    && queryKey[1].split(',').includes(target)
}
