import type { Message, Reaction, User } from '@thiscord/shared'
import type PocketBase from 'pocketbase'

export interface ChannelMessageDraft {
  readonly channel: string
  readonly content: string
  readonly replyTo: string
  readonly attachments: readonly File[]
}

export interface ChannelTyping {
  readonly id: string
  readonly channel: string
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

export interface MessageCursor {
  readonly created: string
  readonly id: string
}

export const messageApi = {
  get(client: PocketBase, messageId: string) {
    return client.send<Message>(
      `/api/thiscord/messages/${encodeURIComponent(messageId)}`,
      {},
    )
  },
  list(client: PocketBase, channelId: string, cursor: MessageCursor | null, perPage = 50) {
    const search = new URLSearchParams({ perPage: String(perPage) })
    if (cursor) {
      search.set('beforeCreated', cursor.created)
      search.set('beforeId', cursor.id)
    }
    return client.send<{
      readonly perPage: number
      readonly hasMore: boolean
      readonly nextCursor: MessageCursor | null
      readonly items: Message[]
    }>(
      `/api/thiscord/channels/${encodeURIComponent(channelId)}/messages?${search}`,
      {},
    )
  },
  activeTyping(client: PocketBase, channelId: string) {
    return client.send<{ readonly items: ChannelTyping[] }>(
      `/api/thiscord/channels/${encodeURIComponent(channelId)}/typing`,
      {},
    )
  },
  reactions(client: PocketBase, channelId: string, messageIds: readonly string[]) {
    return client.send<{ readonly reactions: Reaction[] }>(
      `/api/thiscord/channels/${encodeURIComponent(channelId)}/reactions/query`,
      { method: 'POST', body: { messageIds } },
    )
  },
  search(
    client: PocketBase,
    input: {
      readonly communityId: string
      readonly channelId: string
      readonly query: string
      readonly pinned: boolean
      readonly page: number
    },
  ) {
    const params = new URLSearchParams({
      channel: input.channelId,
      q: input.query,
      pinned: input.pinned ? '1' : '0',
      page: String(input.page),
      perPage: '50',
    })
    return client.send<{ page: number; hasMore: boolean; items: Message[] }>(
      `/api/thiscord/communities/${encodeURIComponent(input.communityId)}/search?${params}`,
      {},
    )
  },
  markRead(client: PocketBase, channelId: string, lastMessage: string) {
    return client.send(`/api/thiscord/channels/${encodeURIComponent(channelId)}/read`, {
      method: 'POST',
      body: { lastMessage },
    })
  },
  create(client: PocketBase, draft: ChannelMessageDraft) {
    return client.send('/api/thiscord/messages', { method: 'POST', body: draft })
  },
  update(client: PocketBase, messageId: string, patch: { readonly content?: string; readonly pinned?: boolean }) {
    return client.send(`/api/thiscord/messages/${encodeURIComponent(messageId)}`, {
      method: 'PATCH',
      body: patch,
    })
  },
  remove(client: PocketBase, messageId: string) {
    return client.send(`/api/thiscord/messages/${encodeURIComponent(messageId)}`, { method: 'DELETE' })
  },
  react(client: PocketBase, messageId: string, emoji: string) {
    return client.send(`/api/thiscord/messages/${encodeURIComponent(messageId)}/reactions`, {
      method: 'POST',
      body: { emoji },
    })
  },
  typing(client: PocketBase, channelId: string) {
    return client.send(`/api/thiscord/channels/${encodeURIComponent(channelId)}/typing`, { method: 'POST' })
  },
  unreadSummary(client: PocketBase, communityId: string) {
    return client.send<{ readonly items: UnreadSummaryItem[] }>(
      `/api/thiscord/communities/${encodeURIComponent(communityId)}/unread-summary`,
      {},
    )
  },
} as const
