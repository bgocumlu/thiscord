export const conversationKeys = {
  all: ['conversations'] as const,
  list: (userId?: string, ids = '') => (
    userId ? [...conversationKeys.all, userId, ids] as const : conversationKeys.all
  ),
  target: (conversationId: string) => [...conversationKeys.all, 'target', conversationId] as const,
  members: ['conversation_members'] as const,
  memberships: (userId: string) => [...conversationKeys.members, userId] as const,
  membersForConversations: (ids: string) => [...conversationKeys.members, 'conversations', ids] as const,
  messages: (conversationId: string) => ['direct_messages', conversationId] as const,
  messagesAll: ['direct_messages'] as const,
  reactionsAll: ['direct_reactions'] as const,
  reactionsRoot: (conversationId: string) => ['direct_reactions', conversationId] as const,
  reactions: (conversationId: string, messageIds: string) => (
    [...conversationKeys.reactionsRoot(conversationId), messageIds] as const
  ),
  searchAll: ['direct_message_search'] as const,
  searchRoot: (conversationId: string) => [...conversationKeys.searchAll, conversationId] as const,
  search: (conversationId: string, query: string, pinned: boolean) => (
    [...conversationKeys.searchRoot(conversationId), query, pinned] as const
  ),
} as const
