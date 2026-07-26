import type {
  Channel,
  CallParticipantRecord,
  CallSessionRecord,
  Community,
  Conversation,
  ConversationMember,
  DirectMessage,
  DirectReaction,
  EffectivePermissions,
  Membership,
  Message,
  PresenceStatus,
  Reaction,
  ReadState,
  Role,
  User,
} from '@thiscord/shared'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import type { RecordModel } from 'pocketbase'
import { usePocketBase } from '../lib/contexts'

export interface MembershipWithCommunity extends Membership {
  readonly expand?: {
    readonly user?: User
    readonly community?: Community
  }
}

export interface PresenceRecord {
  readonly id: string
  readonly user: string
  readonly status: PresenceStatus
  readonly deviceId: string
  readonly expiresAt: string
}

export interface TypingRecord {
  readonly id: string
  readonly channel: string
  readonly user: string
  readonly expiresAt: string
  readonly expand?: {
    readonly user?: User
  }
}

export interface DirectTypingRecord {
  readonly id: string
  readonly conversation: string
  readonly user: string
  readonly expiresAt: string
  readonly expand?: {
    readonly user?: User
  }
}

export interface UnreadSummaryItem {
  readonly channel: string
  readonly message: string
  readonly author: string
  readonly created: string
}

export interface NotificationRecord {
  readonly id: string
  readonly user: string
  readonly actor: string
  readonly community: string
  readonly channel: string
  readonly message: string
  readonly type: string
  readonly readAt: string
  readonly created: string
  readonly data?: {
    readonly conversation?: string
    readonly directMessage?: string
  }
  readonly expand?: {
    readonly actor?: User
  }
}

function records<T>(items: RecordModel[]): T[] {
  return items as unknown as T[]
}

export function useMemberships(userId: string) {
  const client = usePocketBase()
  return useQuery({
    queryKey: ['memberships', userId],
    enabled: Boolean(userId),
    queryFn: async () => records<MembershipWithCommunity>(await client.collection('memberships').getFullList({
      filter: client.filter("user = {:user} && state = 'active'", { user: userId }),
      expand: 'community',
      sort: 'created',
    })),
  })
}

export function useCommunityData(communityId: string) {
  const client = usePocketBase()
  const enabled = Boolean(communityId)

  const channels = useQuery({
    queryKey: ['channels', communityId],
    enabled,
    queryFn: async () => records<Channel>(await client.collection('channels').getFullList({
      filter: client.filter('community = {:community}', { community: communityId }),
      sort: 'position,created',
    })),
  })

  const members = useQuery({
    queryKey: ['memberships', 'community', communityId],
    enabled,
    queryFn: async () => records<Membership>(await client.collection('memberships').getFullList({
      filter: client.filter("community = {:community} && state = 'active'", { community: communityId }),
      expand: 'user',
      sort: 'joinedAt',
    })),
  })

  const roles = useQuery({
    queryKey: ['roles', communityId],
    enabled,
    queryFn: async () => records<Role>(await client.collection('roles').getFullList({
      filter: client.filter('community = {:community}', { community: communityId }),
      sort: '-position',
    })),
  })

  const memberRoles = useQuery({
    queryKey: ['member_roles', communityId],
    enabled,
    queryFn: async () => records<{ id: string; membership: string; role: string }>(
      await client.collection('member_roles').getFullList({
        filter: client.filter('membership.community = {:community}', { community: communityId }),
      }),
    ),
  })

  const presence = useQuery({
    queryKey: ['presence', communityId, (members.data ?? []).map((membership) => membership.user).join(',')],
    enabled: enabled && members.isSuccess,
    queryFn: async () => {
      const memberIds = (members.data ?? []).map((membership) => membership.user)
      if (!memberIds.length) return [] as PresenceRecord[]
      const memberFilter = memberIds.map((id) => client.filter('user = {:id}', { id })).join(' || ')
      const filter = `(${memberFilter}) && ${client.filter('expiresAt > {:now}', { now: new Date() })}`
      return records<PresenceRecord>(await client.collection('presence').getFullList({ filter }))
    },
    refetchInterval: 30_000,
  })

  const readStates = useQuery({
    queryKey: ['read_states', communityId],
    enabled,
    queryFn: async () => records<ReadState>(await client.collection('read_states').getFullList({
      filter: client.filter('channel.community = {:community}', { community: communityId }),
    })),
  })

  const unreadSummary = useQuery({
    queryKey: ['messages', 'unread-summary', communityId],
    enabled,
    queryFn: async () => client.send<{ items: UnreadSummaryItem[] }>(
      `/api/thiscord/communities/${communityId}/unread-summary`,
      {},
    ),
  })

  return { channels, members, roles, memberRoles, presence, readStates, unreadSummary }
}

export function useEffectivePermissions(communityId: string, channelId = '') {
  const client = usePocketBase()
  return useQuery({
    queryKey: ['effective_permissions', communityId, channelId],
    enabled: Boolean(communityId),
    queryFn: async () => await client.send<EffectivePermissions>(
      `/api/thiscord/communities/${communityId}/permissions${channelId ? `?channel=${encodeURIComponent(channelId)}` : ''}`,
      {},
    ),
  })
}

export function useVoiceOccupancy(communityId: string) {
  const client = usePocketBase()
  return useQuery({
    queryKey: ['voice_occupancy', communityId],
    enabled: Boolean(communityId),
    refetchInterval: 20_000,
    queryFn: async () => {
      const calls = records<CallSessionRecord>(await client.collection('call_sessions').getFullList({
        filter: client.filter("channel.community = {:community} && endedAt = ''", { community: communityId }),
        sort: '-created',
      }))
      if (!calls.length) return [] as CallParticipantRecord[]
      const callFilter = calls.map((call) => client.filter('call = {:call}', { call: call.id })).join(' || ')
      return records<CallParticipantRecord>(await client.collection('call_participants').getFullList({
        filter: `(${callFilter}) && ${client.filter("leftAt = '' && expiresAt > {:now}", { now: new Date() })}`,
        expand: 'user,call',
        sort: 'joinedAt',
      }))
    },
  })
}

export function useChannelData(channelId: string) {
  const client = usePocketBase()
  const enabled = Boolean(channelId)

  const messagePages = useInfiniteQuery({
    queryKey: ['messages', channelId],
    enabled,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const page = await client.collection('messages').getList(pageParam, 50, {
        filter: client.filter('channel = {:channel}', { channel: channelId }),
        expand: 'author,replyTo,replyTo.author',
        sort: '-created',
      })
      return {
        items: records<Message>(page.items),
        page: page.page,
        totalPages: page.totalPages,
      }
    },
    getNextPageParam: (lastPage) => lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  })
  const messages = {
    ...messagePages,
    data: messagePages.data?.pages.flatMap((page) => page.items).reverse(),
  }
  const messageIds = (messages.data ?? []).map((message) => message.id)

  const reactions = useQuery({
    queryKey: ['reactions', channelId, messageIds.join(',')],
    enabled: enabled && messageIds.length > 0,
    queryFn: async () => records<Reaction>(await client.collection('reactions').getFullList({
      filter: messageIds.map((id) => client.filter('message = {:id}', { id })).join(' || '),
      sort: 'created',
    })),
  })

  const typing = useQuery({
    queryKey: ['typing', channelId],
    enabled,
    refetchInterval: 8_000,
    queryFn: async () => records<TypingRecord>(await client.collection('typing').getFullList({
      filter: client.filter('channel = {:channel} && expiresAt > {:now}', {
        channel: channelId,
        now: new Date(),
      }),
      expand: 'user',
    })),
  })

  return { messages, reactions, typing }
}

export function useConversations(userId: string) {
  const client = usePocketBase()
  const enabled = Boolean(userId)
  const memberships = useQuery({
    queryKey: ['conversation_members', userId],
    enabled,
    queryFn: async () => records<ConversationMember>(await client.collection('conversation_members').getFullList({
      filter: client.filter('user = {:user}', { user: userId }),
      expand: 'conversation',
      sort: '-created',
    })),
  })

  const conversationIds = (memberships.data ?? []).map((item) => item.conversation)
  const conversations = useQuery({
    queryKey: ['conversations', userId, conversationIds.join(',')],
    enabled: conversationIds.length > 0,
    queryFn: async () => {
      const filter = conversationIds.map((id) => client.filter('id = {:id}', { id })).join(' || ')
      return records<Conversation>(await client.collection('conversations').getFullList({ filter, sort: '-updated' }))
    },
  })
  const members = useQuery({
    queryKey: ['conversation_members', 'conversations', conversationIds.join(',')],
    enabled: conversationIds.length > 0,
    queryFn: async () => {
      const filter = conversationIds.map((id) => client.filter('conversation = {:id}', { id })).join(' || ')
      return records<ConversationMember>(await client.collection('conversation_members').getFullList({
        filter,
        expand: 'user',
        sort: 'joinedAt',
      }))
    },
  })
  return { memberships, conversations, members }
}

export function useDirectMessages(conversationId: string) {
  const client = usePocketBase()
  const query = useInfiniteQuery({
    queryKey: ['direct_messages', conversationId],
    enabled: Boolean(conversationId),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const page = await client.collection('direct_messages').getList(pageParam, 50, {
        filter: client.filter('conversation = {:conversation}', { conversation: conversationId }),
        expand: 'author,replyTo,replyTo.author',
        sort: '-created',
      })
      return {
        items: records<DirectMessage>(page.items),
        page: page.page,
        totalPages: page.totalPages,
      }
    },
    getNextPageParam: (lastPage) => lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  })
  return {
    ...query,
    data: query.data?.pages.flatMap((page) => page.items).reverse(),
  }
}

export function useDirectReactions(conversationId: string, messageIds: readonly string[]) {
  const client = usePocketBase()
  return useQuery({
    queryKey: ['direct_reactions', conversationId, messageIds.join(',')],
    enabled: Boolean(conversationId) && messageIds.length > 0,
    queryFn: async () => records<DirectReaction>(await client.collection('direct_reactions').getFullList({
      filter: messageIds.map((id) => client.filter('message = {:id}', { id })).join(' || '),
      sort: 'created',
    })),
  })
}

export function useDirectTyping(conversationId: string) {
  const client = usePocketBase()
  return useQuery({
    queryKey: ['direct_typing', conversationId],
    enabled: Boolean(conversationId),
    refetchInterval: 8_000,
    queryFn: async () => records<DirectTypingRecord>(await client.collection('direct_typing').getFullList({
      filter: client.filter('conversation = {:conversation} && expiresAt > {:now}', {
        conversation: conversationId,
        now: new Date(),
      }),
      expand: 'user',
    })),
  })
}

export function useNotifications(userId: string) {
  const client = usePocketBase()
  const query = useInfiniteQuery({
    queryKey: ['notifications', userId],
    enabled: Boolean(userId),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const page = await client.collection('notifications').getList(pageParam, 30, {
        filter: client.filter('user = {:user}', { user: userId }),
        expand: 'actor',
        sort: '-created',
      })
      return {
        items: records<NotificationRecord>(page.items),
        page: page.page,
        totalPages: page.totalPages,
      }
    },
    getNextPageParam: (lastPage) => lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  })
  return {
    ...query,
    data: query.data?.pages.flatMap((page) => page.items),
  }
}
