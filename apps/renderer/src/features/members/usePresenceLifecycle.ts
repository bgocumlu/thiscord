import type { PresenceStatus, User } from '@thiscord/shared'
import { transientTimings } from '@thiscord/shared'
import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createCoalescedReporter } from '../../lib/coalescedReporter'
import { usePocketBase } from '../../lib/contexts'
import { useQueryClient } from '@tanstack/react-query'
import type { CommunityMemberPage, PresenceRecord } from './api'
import { memberApi } from './api'
import { memberKeys } from './queryKeys'

function patchOwnPresence(
  queryClient: QueryClient,
  userId: string,
  status: PresenceStatus,
) {
  queryClient.setQueriesData<InfiniteData<CommunityMemberPage>>(
    { queryKey: memberKeys.directories },
    (current) => {
      if (!current) return current
      let changed = false
      const pages = current.pages.map((page) => {
        const belongs = page.items.some((membership) => membership.user === userId)
        const hadPresence = page.presence.some((item) => item.user === userId)
        if (!belongs && !hadPresence) return page
        const withoutUser = page.presence.filter((item) => item.user !== userId)
        const nextPresence: PresenceRecord[] = status === 'offline'
          ? withoutUser
          : [...withoutUser, { id: `self:${userId}`, user: userId, status }]
        changed = true
        return { ...page, presence: nextPresence }
      })
      return changed ? { ...current, pages } : current
    },
  )
}

export function preferredPresence(
  preference: User['status'],
  activeCall: boolean,
  lastActivityAt: number,
  now = Date.now(),
) {
  if (preference === 'offline' || preference === 'dnd' || preference === 'idle') {
    return preference
  }
  if (!activeCall && now - lastActivityAt >= transientTimings.presenceIdleMs) {
    return 'idle'
  }
  return 'online'
}

export interface PresenceLifecycle {
  readonly error: string
  readonly status: PresenceStatus
  readonly close: () => Promise<void>
}

export function usePresenceLifecycle(user: User, activeCall = false): PresenceLifecycle {
  const client = usePocketBase()
  const queryClient = useQueryClient()
  const activeCallRef = useRef(activeCall)
  const heartbeatRef = useRef<() => void>(() => undefined)
  const closeRef = useRef<() => Promise<void>>(async () => undefined)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<PresenceStatus>(user.status)

  useEffect(() => {
    let leaseId = crypto.randomUUID()
    let sequence = 0
    let closed = false
    let lastActivityAt = Date.now()
    let idleTimer: number | undefined
    let heartbeatTimer: number | undefined
    const reporter = createCoalescedReporter(() => {
      setError('Presence could not reach the server. Retrying…')
    })

    const updateLocal = (nextStatus: PresenceStatus) => {
      setStatus(nextStatus)
      patchOwnPresence(queryClient, user.id, nextStatus)
    }

    const request = (
      nextStatus: PresenceStatus,
      options: { readonly keepalive?: boolean; readonly direct?: boolean } = {},
    ) => {
      const input = { leaseId, sequence: ++sequence, status: nextStatus }
      updateLocal(nextStatus)
      const run = async () => {
        if (options.keepalive) {
          await fetch(`${client.baseURL}/api/thiscord/presence`, {
            method: 'POST',
            headers: {
              authorization: client.authStore.token,
              'content-type': 'application/json',
            },
            body: JSON.stringify(input),
            keepalive: true,
          })
          return
        }
        const controller = new AbortController()
        const timeout = window.setTimeout(
          () => controller.abort(),
          transientTimings.transientRequestTimeoutMs,
        )
        try {
          const result = await memberApi.updatePresence(
            client,
            { ...input, signal: controller.signal },
          )
          setError('')
          if (!result.accepted && input.status !== 'offline' && !closed) {
            leaseId = crypto.randomUUID()
            sequence = 0
            heartbeat()
          }
        } finally {
          window.clearTimeout(timeout)
        }
      }
      if (options.direct) return run()
      reporter.submit(run)
      return Promise.resolve()
    }

    const heartbeat = () => {
      if (closed || user.status === 'offline') return
      void request(preferredPresence(user.status, activeCallRef.current, lastActivityAt))
    }

    const close = (keepalive = false) => {
      if (closed) return Promise.resolve()
      closed = true
      reporter.clearPending()
      if (heartbeatTimer) window.clearInterval(heartbeatTimer)
      if (idleTimer) window.clearTimeout(idleTimer)
      return request('offline', { direct: true, keepalive }).catch(() => undefined)
    }

    const scheduleIdle = () => {
      if (idleTimer) window.clearTimeout(idleTimer)
      if (user.status !== 'online' || activeCallRef.current) return
      const delay = Math.max(
        0,
        transientTimings.presenceIdleMs - (Date.now() - lastActivityAt),
      )
      idleTimer = window.setTimeout(heartbeat, delay)
    }

    const onActivity = () => {
      const wasIdle = preferredPresence(user.status, activeCallRef.current, lastActivityAt) === 'idle'
      lastActivityAt = Date.now()
      scheduleIdle()
      if (wasIdle) heartbeat()
    }
    const onOnline = () => heartbeat()
    const onPageHide = () => {
      void close(true)
    }
    const onPageShow = () => {
      if (!closed) return
      leaseId = crypto.randomUUID()
      sequence = 0
      closed = false
      lastActivityAt = Date.now()
      start()
    }
    const start = () => {
      if (user.status === 'offline') {
        void request('offline')
        closed = true
        return
      }
      heartbeat()
      heartbeatTimer = window.setInterval(
        heartbeat,
        transientTimings.presenceHeartbeatMs,
      )
      scheduleIdle()
    }

    heartbeatRef.current = heartbeat
    closeRef.current = () => close(false)
    window.addEventListener('pointerdown', onActivity, { passive: true })
    window.addEventListener('keydown', onActivity)
    window.addEventListener('touchstart', onActivity, { passive: true })
    window.addEventListener('online', onOnline)
    window.addEventListener('pagehide', onPageHide)
    window.addEventListener('pageshow', onPageShow)
    start()

    return () => {
      heartbeatRef.current = () => undefined
      closeRef.current = async () => undefined
      if (heartbeatTimer) window.clearInterval(heartbeatTimer)
      if (idleTimer) window.clearTimeout(idleTimer)
      window.removeEventListener('pointerdown', onActivity)
      window.removeEventListener('keydown', onActivity)
      window.removeEventListener('touchstart', onActivity)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('pagehide', onPageHide)
      window.removeEventListener('pageshow', onPageShow)
      void close(true)
    }
  }, [client, queryClient, user.id, user.status])

  useEffect(() => {
    activeCallRef.current = activeCall
    heartbeatRef.current()
  }, [activeCall])

  const close = useCallback(() => closeRef.current(), [])
  return { error, status, close }
}
