import { policyLimits } from '@thiscord/shared'
import { useQuery } from '@tanstack/react-query'
import { usePocketBase } from '../../lib/contexts'
import { searchApi } from './api'
import { searchKeys } from './queryKeys'

export const globalSearchRefreshMs = 5_000

export function useGlobalSearch(query: string) {
  const client = usePocketBase()
  return useQuery({
    queryKey: searchKeys.global(query),
    enabled: query.length >= policyLimits.search.queryMin,
    queryFn: () => searchApi.global(client, query),
    refetchInterval: globalSearchRefreshMs,
    refetchIntervalInBackground: false,
  })
}
