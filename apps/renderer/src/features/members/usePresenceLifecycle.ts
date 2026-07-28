import type { User } from '@thiscord/shared'
import { transientTimings } from '@thiscord/shared'
import { useEffect, useState } from 'react'
import { usePocketBase } from '../../lib/contexts'
import { callDeviceId } from '../calls/api'
import { memberApi } from './api'

export function usePresenceLifecycle(user: User) {
  const client = usePocketBase()
  const [error, setError] = useState('')

  useEffect(() => {
    const deviceId = callDeviceId()
    const preferredStatus = () => user.status === 'offline'
      ? 'offline'
      : user.status === 'dnd'
        ? 'dnd'
        : user.status === 'idle' || document.hidden
          ? 'idle'
          : 'online'
    const heartbeat = () => {
      void memberApi.updatePresence(client, {
        deviceId,
        status: preferredStatus(),
      }).then(
        () => setError(''),
        () => setError('Presence could not reach the server. Retrying…'),
      )
    }
    const offline = () => {
      void fetch(`${client.baseURL}/api/thiscord/presence`, {
        method: 'POST',
        headers: {
          authorization: client.authStore.token,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ deviceId, status: 'offline' }),
        keepalive: true,
      }).catch(() => undefined)
    }
    heartbeat()
    const timer = window.setInterval(heartbeat, transientTimings.presenceHeartbeatMs)
    document.addEventListener('visibilitychange', heartbeat)
    window.addEventListener('focus', heartbeat)
    window.addEventListener('online', heartbeat)
    window.addEventListener('pagehide', offline)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', heartbeat)
      window.removeEventListener('focus', heartbeat)
      window.removeEventListener('online', heartbeat)
      window.removeEventListener('pagehide', offline)
    }
  }, [client, user.status])

  return error
}
