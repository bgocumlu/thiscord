import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { usePocketBase } from '../../lib/contexts'
import { conversationApi } from './api'
import type { DirectMessageCursor } from './api'
import type { ConversationCursor } from './api'
import { conversationKeys } from './queryKeys'

export function useConversationTarget(conversationId: string, enabled = true) {
  const client = usePocketBase()
  return useQuery({
    queryKey: conversationKeys.target(conversationId),
    enabled: enabled && Boolean(conversationId),
    queryFn: () => conversationApi.get(client, conversationId),
    retry: false,
  })
}

export function useConversations(userId: string) {
  const client = usePocketBase()
  const enabled = Boolean(userId)
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: conversationKeys.list(userId),
    enabled,
    initialPageParam: null as ConversationCursor | null,
    queryFn: ({ pageParam }) => conversationApi.list(client, pageParam),
    getNextPageParam: (lastPage) => lastPage.hasMore
      ? lastPage.nextCursor ?? undefined
      : undefined,
  })
  const conversations = useMemo(
    () => data?.pages.flatMap((page) => page.conversations),
    [data],
  )
  const members = useMemo(
    () => data?.pages.flatMap((page) => page.members),
    [data],
  )
  const unreadConversationIds = useMemo(
    () => new Set(data?.pages.flatMap((page) => page.unreadConversationIds) ?? []),
    [data],
  )
  const queryState = {
    error,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isLoading,
    refetch,
  }
  return {
    conversations: { ...queryState, data: conversations },
    members: { ...queryState, data: members },
    unreadConversationIds,
  }
}

export function useDirectMessages(conversationId: string) {
  const client = usePocketBase()
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: conversationKeys.messages(conversationId),
    enabled: Boolean(conversationId),
    initialPageParam: null as DirectMessageCursor | null,
    queryFn: ({ pageParam }) => conversationApi.messages(client, conversationId, pageParam),
    getNextPageParam: (lastPage) => lastPage.hasMore
      ? lastPage.nextCursor ?? undefined
      : undefined,
  })
  const messages = useMemo(
    () => data?.pages.flatMap((page) => page.items).reverse(),
    [data],
  )
  return {
    data: messages,
    error,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isLoading,
    refetch,
  }
}
