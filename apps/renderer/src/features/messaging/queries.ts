import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { usePocketBase } from '../../lib/contexts'
import { messageApi } from './api'
import type { MessageCursor } from './api'
import { messageKeys } from './queryKeys'

export function useChannelMessages(channelId: string) {
  const client = usePocketBase()
  const enabled = Boolean(channelId)
  const pages = useInfiniteQuery({
    queryKey: messageKeys.channel(channelId),
    enabled,
    initialPageParam: null as MessageCursor | null,
    queryFn: ({ pageParam }) => messageApi.list(client, channelId, pageParam),
    getNextPageParam: (lastPage) => lastPage.hasMore
      ? lastPage.nextCursor ?? undefined
      : undefined,
  })
  const messages = useMemo(
    () => pages.data?.pages.flatMap((page) => page.items).reverse(),
    [pages.data],
  )
  return {
    messages: { ...pages, data: messages },
  }
}

export function useUnreadSummary(communityId: string) {
  const client = usePocketBase()
  return useQuery({
    queryKey: messageKeys.unreadSummary(communityId),
    enabled: Boolean(communityId),
    queryFn: () => messageApi.unreadSummary(client, communityId),
  })
}
