import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { usePocketBase } from '../../lib/contexts'
import { channelApi } from './api'
import { channelKeys } from './queryKeys'

export function useChannelTarget(channelId: string, enabled = true) {
  const client = usePocketBase()
  return useQuery({
    queryKey: channelKeys.target(channelId),
    enabled: enabled && Boolean(channelId),
    queryFn: () => channelApi.get(client, channelId),
    retry: false,
  })
}

export function useCommunityChannels(communityId: string) {
  const client = usePocketBase()
  const query = useInfiniteQuery({
    queryKey: channelKeys.list(communityId),
    enabled: Boolean(communityId),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => channelApi.list(client, communityId, pageParam),
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.page + 1 : undefined,
  })
  const items = useMemo(
    () => query.data?.pages.flatMap((page) => page.items),
    [query.data],
  )
  return { ...query, data: items }
}

export function useEffectivePermissions(communityId: string, channelId = '') {
  const client = usePocketBase()
  return useQuery({
    queryKey: channelKeys.effectivePermissions(communityId, channelId),
    enabled: Boolean(communityId),
    queryFn: () => channelApi.effectivePermissions(client, communityId, channelId),
  })
}
