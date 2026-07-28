import type {
  Conversation,
  ConversationMember,
  DirectMessage,
  DirectReaction,
} from '@thiscord/shared'
import type PocketBase from 'pocketbase'

export interface DirectMessageDraft {
  readonly conversation: string
  readonly content: string
  readonly replyTo: string
  readonly attachments: readonly File[]
}

export type CreateConversationInput =
  | { readonly kind: 'direct'; readonly userIds: readonly [string] | readonly string[] }
  | { readonly kind: 'group'; readonly userIds: readonly string[]; readonly name: string }

export interface ConversationPage {
  readonly perPage: number
  readonly hasMore: boolean
  readonly nextCursor: ConversationCursor | null
  readonly conversations: Conversation[]
  readonly members: ConversationMember[]
  readonly unreadConversationIds: string[]
}

export interface ConversationCursor {
  readonly activity: string
  readonly id: string
}

export interface ConversationTarget {
  readonly conversation: Conversation
  readonly members: ConversationMember[]
}

export interface DirectMessageCursor {
  readonly created: string
  readonly id: string
}

export const conversationApi = {
  get(client: PocketBase, conversationId: string) {
    return client.send<ConversationTarget>(
      `/api/thiscord/conversations/${encodeURIComponent(conversationId)}`,
      {},
    )
  },
  reactions(client: PocketBase, conversationId: string, messageIds: readonly string[]) {
    return client.send<{ readonly reactions: DirectReaction[] }>(
      `/api/thiscord/conversations/${encodeURIComponent(conversationId)}/reactions/query`,
      { method: 'POST', body: { messageIds } },
    )
  },
  messages(
    client: PocketBase,
    conversationId: string,
    cursor: DirectMessageCursor | null,
    perPage = 50,
  ) {
    const search = new URLSearchParams({ perPage: String(perPage) })
    if (cursor) {
      search.set('beforeCreated', cursor.created)
      search.set('beforeId', cursor.id)
    }
    return client.send<{
      readonly perPage: number
      readonly hasMore: boolean
      readonly nextCursor: DirectMessageCursor | null
      readonly items: DirectMessage[]
    }>(
      `/api/thiscord/conversations/${encodeURIComponent(conversationId)}/messages?${search}`,
      {},
    )
  },
  async getMessage(client: PocketBase, messageId: string) {
    return await client.collection('direct_messages').getOne(messageId, {
      expand: 'author,replyTo,replyTo.author',
    }) as unknown as DirectMessage
  },
  list(client: PocketBase, cursor: ConversationCursor | null, perPage = 50) {
    const search = new URLSearchParams({ perPage: String(perPage) })
    if (cursor) {
      search.set('beforeActivity', cursor.activity)
      search.set('beforeId', cursor.id)
    }
    return client.send<ConversationPage>(`/api/thiscord/conversations?${search}`, {})
  },
  create(client: PocketBase, input: CreateConversationInput) {
    return client.send<Conversation>('/api/thiscord/conversations', {
      method: 'POST',
      body: input,
    })
  },
  rename(client: PocketBase, conversationId: string, name: FormDataEntryValue | null) {
    return client.send(`/api/thiscord/conversations/${encodeURIComponent(conversationId)}`, {
      method: 'PATCH',
      body: { name },
    })
  },
  addMember(client: PocketBase, conversationId: string, userId: string) {
    return client.send(
      `/api/thiscord/conversations/${encodeURIComponent(conversationId)}/members`,
      { method: 'POST', body: { userId } },
    )
  },
  removeMember(client: PocketBase, conversationId: string, userId: string) {
    return client.send(
      `/api/thiscord/conversations/${encodeURIComponent(conversationId)}/members/${encodeURIComponent(userId)}`,
      { method: 'DELETE' },
    )
  },
  markRead(client: PocketBase, conversationId: string, lastMessage: string) {
    return client.send(`/api/thiscord/conversations/${encodeURIComponent(conversationId)}/read`, {
      method: 'POST',
      body: { lastMessage },
    })
  },
  createMessage(client: PocketBase, draft: DirectMessageDraft) {
    return client.send('/api/thiscord/direct-messages', { method: 'POST', body: draft })
  },
  updateMessage(
    client: PocketBase,
    messageId: string,
    patch: { readonly content?: string; readonly pinned?: boolean },
  ) {
    return client.send(`/api/thiscord/direct-messages/${encodeURIComponent(messageId)}`, {
      method: 'PATCH',
      body: patch,
    })
  },
  removeMessage(client: PocketBase, messageId: string) {
    return client.send(`/api/thiscord/direct-messages/${encodeURIComponent(messageId)}`, { method: 'DELETE' })
  },
  react(client: PocketBase, messageId: string, emoji: string) {
    return client.send(`/api/thiscord/direct-messages/${encodeURIComponent(messageId)}/reactions`, {
      method: 'POST',
      body: { emoji },
    })
  },
  async searchMessages(
    client: PocketBase,
    input: {
      readonly conversationId: string
      readonly query: string
      readonly pinned: boolean
      readonly page: number
    },
  ) {
    const conditions = [
      client.filter('conversation = {:conversation}', { conversation: input.conversationId }),
    ]
    if (input.query) conditions.push(client.filter('content ~ {:query}', { query: input.query }))
    if (input.pinned) conditions.push('pinned = true')
    const result = await client.collection('direct_messages').getList(input.page, 50, {
      filter: conditions.join(' && '),
      expand: 'author,replyTo,replyTo.author',
      sort: '-created,-id',
    })
    return {
      items: result.items as unknown as DirectMessage[],
      page: result.page,
      totalPages: result.totalPages,
    }
  },
} as const
