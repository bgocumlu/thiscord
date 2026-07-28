export const messageKeys = {
  all: ['messages'] as const,
  channel: (channelId: string) => [...messageKeys.all, channelId] as const,
  unreadSummaries: ['unread_summary'] as const,
  unreadSummary: (communityId: string) => [...messageKeys.unreadSummaries, communityId] as const,
  reactionsAll: ['reactions'] as const,
  reactionsRoot: (channelId: string) => ['reactions', channelId] as const,
  reactions: (channelId: string, messageIds: string) => (
    [...messageKeys.reactionsRoot(channelId), messageIds] as const
  ),
  searchAll: ['message_search'] as const,
  searchRoot: (communityId: string, channelId: string) => (
    [...messageKeys.searchAll, communityId, channelId] as const
  ),
  search: (communityId: string, channelId: string, query: string, pinned: boolean) => (
    [...messageKeys.searchRoot(communityId, channelId), query, pinned] as const
  ),
} as const
