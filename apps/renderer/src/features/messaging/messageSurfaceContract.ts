import type {
  DirectMessage,
  DirectReaction,
  Message,
  Reaction,
  User,
} from '@thiscord/shared'
import type { QueryKey } from '@tanstack/react-query'

export type SurfaceMessage = Message | DirectMessage
export type SurfaceReaction = Reaction | DirectReaction

export interface MessageSearchPage<TMessage extends SurfaceMessage> {
  readonly page: number
  readonly hasMore: boolean
  readonly items: TMessage[]
}

export interface MessageMutationContext<TMessage extends SurfaceMessage> {
  readonly content: string
  readonly files: readonly File[]
  readonly reply: TMessage | null
  readonly editing: TMessage | null
}

export interface MessageSurfacePolicy<TMessage extends SurfaceMessage> {
  readonly disabledReason?: string
  readonly canEdit: (message: TMessage, currentUser: User) => boolean
  readonly canDelete: (message: TMessage, currentUser: User) => boolean
  readonly canPin: (message: TMessage, currentUser: User) => boolean
}

export interface MessageSurfaceAdapter<TMessage extends SurfaceMessage> {
  readonly kind: 'channel' | 'conversation'
  readonly targetId: string
  readonly messageKey: QueryKey
  readonly reactionsKey: QueryKey
  readonly searchRoot: QueryKey
  readonly searchKey: (query: string, pinned: boolean) => QueryKey
  readonly reverseSearchResults: boolean
  readonly persistedReadMessage: string
  readonly policy: MessageSurfacePolicy<TMessage>
  readonly search: (
    query: string,
    pinned: boolean,
    page: number,
  ) => Promise<MessageSearchPage<TMessage>>
  readonly load: (messageId: string) => Promise<TMessage>
  readonly loadReactions: (messageIds: readonly string[]) => Promise<readonly SurfaceReaction[]>
  readonly save: (context: MessageMutationContext<TMessage>) => Promise<void>
  readonly remove: (message: TMessage) => Promise<void>
  readonly react: (message: TMessage, emoji: string) => Promise<void>
  readonly pin: (message: TMessage) => Promise<void>
  readonly markRead: (messageId: string) => Promise<void>
  readonly reportTyping: () => Promise<void>
}
