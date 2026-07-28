import type {
  Channel,
  Community,
  Conversation,
  DirectMessage,
  Message,
  SearchTarget,
  User,
} from '@thiscord/shared'
import type PocketBase from 'pocketbase'

type SearchChannel = Channel & { readonly expand?: { readonly community?: Community } }
type SearchMessage = Omit<Message, 'expand'> & {
  readonly expand?: {
    readonly author?: User
    readonly channel?: SearchChannel
  }
}
type SearchDirectMessage = Omit<DirectMessage, 'expand'> & {
  readonly expand?: {
    readonly author?: User
    readonly conversation?: Conversation
  }
}
interface GlobalSearchResponse {
  readonly channels: SearchChannel[]
  readonly messages: SearchMessage[]
  readonly directMessages: SearchDirectMessage[]
  readonly people: User[]
}

export const searchApi = {
  async global(client: PocketBase, query: string): Promise<SearchTarget[]> {
    const params = new URLSearchParams({ q: query })
    const response = await client.send<GlobalSearchResponse>(`/api/thiscord/search?${params}`, {})
    return [
      ...response.channels.map((channel) => ({ kind: 'channel' as const, channel })),
      ...response.people.map((user) => ({ kind: 'user' as const, user })),
      ...response.messages.map((message) => ({ kind: 'message' as const, message })),
      ...response.directMessages.map((message) => ({
        kind: 'conversation_message' as const,
        message,
      })),
    ]
  },
} as const
