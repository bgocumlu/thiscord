import { useQuery } from '@tanstack/react-query'
import { usePocketBase } from '../../lib/contexts'
import { communityApi } from './api'
import { communityKeys } from './queryKeys'

export function useMemberships(userId: string) {
  const client = usePocketBase()
  return useQuery({
    queryKey: communityKeys.membershipsForUser(userId),
    enabled: Boolean(userId),
    queryFn: () => communityApi.memberships(client, userId),
  })
}
