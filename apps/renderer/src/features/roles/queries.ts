import { useQuery } from '@tanstack/react-query'
import { usePocketBase } from '../../lib/contexts'
import { roleApi } from './api'
import { roleKeys } from './queryKeys'

export function useCommunityRoles(communityId: string) {
  const client = usePocketBase()
  return useQuery({
    queryKey: roleKeys.list(communityId),
    enabled: Boolean(communityId),
    queryFn: () => roleApi.list(client, communityId),
  })
}
