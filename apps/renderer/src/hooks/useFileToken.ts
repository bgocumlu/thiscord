import { useQuery } from '@tanstack/react-query'
import { getTokenPayload } from 'pocketbase'
import { usePocketBase } from '../lib/contexts'

const fallbackRefreshInterval = 60_000
const refreshBuffer = 30_000
const minimumRefreshInterval = 15_000

function refreshInterval(token: string | undefined): number {
  const expiresAt = Number(getTokenPayload(token ?? '').exp) * 1_000
  if (!Number.isFinite(expiresAt) || expiresAt <= 0) return fallbackRefreshInterval
  return Math.max(minimumRefreshInterval, expiresAt - Date.now() - refreshBuffer)
}

export function useFileToken(userId: string, enabled: boolean) {
  const client = usePocketBase()
  return useQuery({
    queryKey: ['file-token', userId],
    queryFn: () => client.files.getToken(),
    enabled: enabled && Boolean(userId),
    staleTime: fallbackRefreshInterval,
    refetchInterval: (query) => refreshInterval(query.state.data),
  })
}
