import { transientTimings } from '@thiscord/shared'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { usePocketBase } from '../../lib/contexts'
import { memberApi } from './api'
import { memberKeys } from './queryKeys'

export function useCommunityMembers(communityId: string) {
  const client = usePocketBase()
  const query = useInfiniteQuery({
    queryKey: memberKeys.directory(communityId),
    enabled: Boolean(communityId),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => memberApi.list(client, communityId, { page: pageParam }),
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.page + 1 : undefined,
    refetchInterval: transientTimings.presencePollMs,
  })
  const members = useMemo(
    () => query.data?.pages.flatMap((page) => page.items),
    [query.data],
  )
  const memberRoles = useMemo(
    () => query.data?.pages.flatMap((page) => page.memberRoles),
    [query.data],
  )
  const presence = useMemo(
    () => query.data?.pages.flatMap((page) => page.presence),
    [query.data],
  )
  return {
    members: { ...query, data: members },
    memberRoles: { ...query, data: memberRoles },
    presence: { ...query, data: presence },
  }
}
