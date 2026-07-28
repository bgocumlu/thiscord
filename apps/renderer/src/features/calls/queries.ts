import type { CallTarget } from '@thiscord/shared'
import { transientTimings } from '@thiscord/shared'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { usePocketBase } from '../../lib/contexts'
import { callApi } from './api'
import { callKeys } from './queryKeys'

export function useCallOccupancy(targets: readonly CallTarget[]) {
  const client = usePocketBase()
  const targetKey = useMemo(
    () => targets.map((target) => `${target.kind}:${target.id}`).sort().join(','),
    [targets],
  )
  return useQuery({
    queryKey: callKeys.occupancy(targetKey),
    enabled: targets.length > 0,
    refetchInterval: transientTimings.callOccupancyPollMs,
    queryFn: async () => {
      const batches: CallTarget[][] = []
      for (let index = 0; index < targets.length; index += 100) {
        batches.push(targets.slice(index, index + 100))
      }
      const responses = await Promise.all(batches.map((batch) => callApi.occupancy(client, batch)))
      return responses.flatMap((response) => response.participants)
    },
  })
}
