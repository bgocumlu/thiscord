import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { usePocketBase } from '../lib/contexts'

const realtimeCollections = [
  'communities',
  'memberships',
  'roles',
  'member_roles',
  'channels',
  'channel_permissions',
  'messages',
  'reactions',
  'read_states',
  'typing',
  'presence',
  'conversations',
  'conversation_members',
  'direct_messages',
  'direct_reactions',
  'direct_typing',
  'call_sessions',
  'call_participants',
  'notifications',
] as const

export function useRealtimeInvalidation(enabled: boolean) {
  const client = usePocketBase()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<'connecting' | 'connected' | 'degraded'>('connecting')

  useEffect(() => {
    if (!enabled) return
    const unsubscribers: Array<() => void> = []
    let cancelled = false
    let retryTimer: number | undefined

    const connect = async () => {
      try {
        await Promise.all(realtimeCollections.map(async (collection) => {
          const unsubscribe = await client.collection(collection).subscribe('*', () => {
            void queryClient.invalidateQueries({ queryKey: [collection] })
            if (['memberships', 'roles', 'member_roles', 'channel_permissions'].includes(collection)) {
              void queryClient.invalidateQueries({ queryKey: ['effective_permissions'] })
            }
            if (collection === 'call_sessions' || collection === 'call_participants') {
              void queryClient.invalidateQueries({ queryKey: ['voice_occupancy'] })
            }
          })
          if (cancelled) {
            void unsubscribe()
          } else {
            unsubscribers.push(unsubscribe)
          }
        }))
        if (!cancelled) setStatus('connected')
      } catch {
        if (!cancelled) {
          for (const unsubscribe of unsubscribers.splice(0)) void unsubscribe()
          setStatus('degraded')
          retryTimer = window.setTimeout(() => void connect(), 5_000)
        }
      }
    }
    void connect()

    return () => {
      cancelled = true
      if (retryTimer) window.clearTimeout(retryTimer)
      for (const unsubscribe of unsubscribers) void unsubscribe()
    }
  }, [client, enabled, queryClient])

  return enabled ? status : 'connecting'
}
