import { transientTimings } from '@thiscord/shared'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { usePocketBase } from '../../lib/contexts'
import { memberApi } from './api'
import { memberKeys } from './queryKeys'

export function useCommunityMembers(communityId: string) {
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
    queryKey: memberKeys.directory(communityId),
    enabled: Boolean(communityId),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => memberApi.list(client, communityId, { page: pageParam }),
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.page + 1 : undefined,
    refetchInterval: transientTimings.presencePollMs,
  })
  const members = useMemo(
    () => data?.pages.flatMap((page) => page.items),
    [data],
  )
  const memberRoles = useMemo(
    () => data?.pages.flatMap((page) => page.memberRoles),
    [data],
  )
  const presence = useMemo(
    () => data?.pages.flatMap((page) => page.presence),
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
    members: { ...queryState, data: members },
    memberRoles: { ...queryState, data: memberRoles },
    presence: { ...queryState, data: presence },
  }
}
