import type { Notification } from '@thiscord/shared'
import type PocketBase from 'pocketbase'

export const notificationApi = {
  unreadCount(client: PocketBase) {
    return client.send<{ readonly count: number }>(
      '/api/thiscord/notifications/unread-count',
      {},
    )
  },
  async list(client: PocketBase, userId: string, page: number, perPage = 30) {
    const result = await client.collection('notifications').getList(page, perPage, {
      filter: client.filter('user = {:user}', { user: userId }),
      expand: 'actor',
      sort: '-created',
    })
    return {
      items: result.items as unknown as Notification[],
      page: result.page,
      totalPages: result.totalPages,
    }
  },
  markRead(client: PocketBase, notificationId: string) {
    return client.send(`/api/thiscord/notifications/${encodeURIComponent(notificationId)}/read`, {
      method: 'POST',
    })
  },
  markAllRead(client: PocketBase) {
    return client.send('/api/thiscord/notifications/read-all', { method: 'POST' })
  },
} as const
