import type { Notification, User } from '@thiscord/shared'
import { useQueryClient } from '@tanstack/react-query'
import { Check, Inbox as InboxIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { DataFailure } from '../../components/WorkspacePrimitives'
import { formatTime } from '../../components/workspaceUtils'
import { usePocketBase } from '../../lib/contexts'
import { useAppRouter } from '../../lib/router'
import { Avatar } from '../members/Avatar'
import { appRoutes } from '../navigation/routes'
import { notificationApi } from './api'
import { notificationKeys } from './queryKeys'
import { useNotifications } from './queries'

function useNotificationSound(
  notifications: readonly Notification[],
  loaded: boolean,
  user: User,
) {
  const latestCreated = useRef<string | null>(null)
  const soundEnabled = user.preferences?.notificationSound !== false
  const status = user.status
  useEffect(() => {
    if (!loaded) return
    let audio: AudioContext | null = null
    let oscillator: OscillatorNode | null = null
    const closeAudio = () => {
      if (audio) void audio.close().catch(() => undefined)
    }
    const newestCreated = notifications.reduce(
      (newest, item) => item.created > newest ? item.created : newest,
      '',
    )
    if (latestCreated.current === null) {
      latestCreated.current = newestCreated
      return
    }
    if (newestCreated > latestCreated.current && soundEnabled && status !== 'dnd') {
      try {
        audio = new window.AudioContext()
        oscillator = audio.createOscillator()
        const gain = audio.createGain()
        oscillator.frequency.value = 540
        gain.gain.setValueAtTime(0.045, audio.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.12)
        oscillator.connect(gain)
        gain.connect(audio.destination)
        oscillator.start()
        oscillator.stop(audio.currentTime + 0.12)
        oscillator.addEventListener('ended', closeAudio, { once: true })
      } catch {
        // Browsers may block audio until the user interacts with the page.
      }
    }
    if (newestCreated > latestCreated.current) latestCreated.current = newestCreated
    return () => {
      oscillator?.removeEventListener('ended', closeAudio)
      try {
        oscillator?.stop()
      } catch {
        // The oscillator may already have completed naturally.
      }
      closeAudio()
    }
  }, [loaded, notifications, soundEnabled, status])
}

export function Inbox({ currentUser }: { readonly currentUser: User }) {
  const client = usePocketBase()
  const queryClient = useQueryClient()
  const { navigate } = useAppRouter()
  const notifications = useNotifications(currentUser.id)
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const items = notifications.data ?? []
  const unread = items.filter((item) => !item.readAt)
  const unreadCount = notifications.unreadCount.data?.count ?? unread.length
  useNotificationSound(items, notifications.isSuccess, currentUser)

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }
    const closeOnPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (
        !popoverRef.current?.contains(target)
        && !triggerRef.current?.contains(target)
      ) setOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    window.addEventListener('pointerdown', closeOnPointerDown)
    return () => {
      window.removeEventListener('keydown', closeOnEscape)
      window.removeEventListener('pointerdown', closeOnPointerDown)
    }
  }, [open])

  const openNotification = (notification: Notification) => {
    if (!notification.readAt) {
      void notificationApi.markRead(client, notification.id)
        .then(() => queryClient.invalidateQueries({
          queryKey: notificationKeys.list(currentUser.id),
        }))
    }
    if (notification.type === 'direct_message') {
      navigate(appRoutes.conversations(
        notification.data.conversation,
        notification.data.directMessage,
      ))
    } else if (notification.type === 'conversation_call') {
      navigate(appRoutes.conversations(notification.data.conversation))
    } else {
      navigate(appRoutes.channel(notification.community, notification.channel))
    }
    setOpen(false)
  }

  return (
    <>
      <div className="titlebar-actions">
        <button
          ref={triggerRef}
          className={open ? 'active' : ''}
          type="button"
          title="Inbox"
          aria-expanded={open}
          aria-controls="notifications-popover"
          onClick={() => setOpen((value) => !value)}
        >
          <InboxIcon size={17} />
          {unreadCount ? <span className="action-badge">{unreadCount}</span> : null}
        </button>
      </div>
      {open ? (
        <div
          ref={popoverRef}
          id="notifications-popover"
          className="notifications-popover"
          role="region"
          aria-label="Inbox notifications"
        >
          <header>
            <span><strong>Inbox</strong><small>{unreadCount} unread</small></span>
            {unreadCount ? (
              <button
                type="button"
                onClick={() => void notificationApi.markAllRead(client)
                  .then(() => queryClient.invalidateQueries({
                    queryKey: notificationKeys.list(currentUser.id),
                  }))
                  .catch(() => undefined)}
              ><Check size={14} />Mark all read</button>
            ) : null}
          </header>
          {items.map((notification) => (
            <button
              type="button"
              onClick={() => openNotification(notification)}
              key={notification.id}
            >
              <Avatar user={notification.expand?.actor ?? currentUser} size="small" />
              <span>
                <strong>{notification.type.replace(/_/g, ' ')}</strong>
                <small>{formatTime(notification.created)}</small>
              </span>
              {!notification.readAt ? (
                <>
                  <i aria-hidden="true" />
                  <span className="visually-hidden">Unread</span>
                </>
              ) : null}
            </button>
          ))}
          {notifications.hasNextPage ? (
            <button
              className="notifications-more"
              type="button"
              disabled={notifications.isFetchingNextPage}
              onClick={() => void notifications.fetchNextPage()}
            >{notifications.isFetchingNextPage ? 'Loading…' : 'Load older notifications'}</button>
          ) : null}
          {notifications.isError ? (
            <DataFailure
              error={notifications.error}
              onRetry={() => void notifications.refetch()}
              label="Could not load notifications."
            />
          ) : null}
          {!items.length && !notifications.isError ? <p>No notifications.</p> : null}
        </div>
      ) : null}
    </>
  )
}
