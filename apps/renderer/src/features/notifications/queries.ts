import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { usePocketBase } from '../../lib/contexts'
import { notificationApi } from './api'
import { notificationKeys } from './queryKeys'

export function useNotifications(userId: string) {
  const client = usePocketBase()
  const query = useInfiniteQuery({
    queryKey: notificationKeys.list(userId),
    enabled: Boolean(userId),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => notificationApi.list(client, userId, pageParam),
    getNextPageParam: (lastPage) => lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  })
  const unreadCount = useQuery({
    queryKey: notificationKeys.unreadCount(userId),
    enabled: Boolean(userId),
    queryFn: () => notificationApi.unreadCount(client),
  })
  const notifications = useMemo(
    () => query.data?.pages.flatMap((page) => page.items),
    [query.data],
  )
  return { ...query, data: notifications, unreadCount }
}
